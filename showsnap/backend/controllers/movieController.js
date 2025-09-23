import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js'; // Used indirectly in createMovie
import logger from '../utils/logger.js';

/**
 * GET /api/movies
 * Fetch all movies with optional filters and pagination
 */
export const getMovies = async (req, res) => {
  try {
    const {
      isUpcoming,
      genre,
      minRating,
      language,
      releasedAfter,
      sortBy,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Combine releaseDate filters safely
    if (isUpcoming === 'true') {
      query.releaseDate = { ...(query.releaseDate || {}), $gt: today };
    }
    if (isUpcoming === 'false') {
      query.releaseDate = { ...(query.releaseDate || {}), $lte: today };
    }
    if (releasedAfter && !isNaN(Date.parse(releasedAfter))) {
      query.releaseDate = { ...(query.releaseDate || {}), $gte: new Date(releasedAfter) };
    }

    if (genre?.trim()) {
      query.genre = { $regex: genre.trim(), $options: 'i' };
    }

    if (minRating && !isNaN(minRating)) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (language?.trim()) {
      query.language = { $regex: language.trim(), $options: 'i' };
    }

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    if (sortBy === 'releaseDate') sortOptions.releaseDate = -1;

    const safeLimit = Math.min(Number(limit), 100);
    const safePage = Math.max(Number(page), 1);

    const movies = await Movie.find(query)
      .populate('theaters', 'name location showtimes')
      .sort(sortOptions)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await Movie.countDocuments(query);

    res.status(200).json({
      count: movies.length,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit),
      movies,
    });
  } catch (err) {
    logger.error(`❌ Error fetching movies: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movies' });
  }
};

/**
 * GET /api/movies/:id
 * Fetch a single movie by ID with populated theater data
 */
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({ error: 'Missing or invalid movie ID' });
    }

    const movie = await Movie.findById(id).lean();

    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    // ✅ Use embeddedTheaters if present
    const embedded = Array.isArray(movie.embeddedTheaters) ? movie.embeddedTheaters : [];

    // Normalize showtimes
    embedded.forEach((t) => {
      if (Array.isArray(t.showtimes)) {
        t.showtimes = t.showtimes.map((s) => new Date(s).toISOString());
      }
    });

    // Normalize releaseDate
    movie.releaseDate = movie.releaseDate
      ? new Date(movie.releaseDate).toISOString()
      : null;

    // ✅ Send embedded theaters as 'theaters' for frontend compatibility
    res.status(200).json({
      ...movie,
      theaters: embedded
    });
  } catch (err) {
    logger.error(`❌ Error fetching movie by ID: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movie' });
  }
};

/**
 * GET /api/movies/genres
 * Get all unique genres for filtering UI
 */
export const getAllGenres = async (req, res) => {
  try {
    const genres = (await Movie.distinct('genre')).filter(g => g?.trim());
    res.status(200).json({ genres });
  } catch (err) {
    logger.error(`❌ Error fetching genres: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching genres' });
  }
};
