import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js';
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

    const location = req.query.location?.trim();
    const query = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isUpcoming === 'true') {
      query.releaseDate = { ...(query.releaseDate || {}), $gt: today };
    }
    if (isUpcoming === 'false') {
      query.releaseDate = { ...(query.releaseDate || {}), $lte: today };
    }
    if (releasedAfter && !isNaN(Date.parse(releasedAfter))) {
      query.releaseDate = { ...(query.releaseDate || {}), $gte: new Date(releasedAfter) };
    }

    if (req.query.location) {
  query['embeddedTheaters.location'] = {
    $regex: req.query.location.trim(),
    $options: 'i'
  };
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
 * Fetch a single movie by ID with embedded theater data
 */
export const getMovieById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  try {
    const movie = await Movie.findById(id).lean();
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const embedded = Array.isArray(movie.embeddedTheaters) ? movie.embeddedTheaters : [];

    embedded.forEach((t) => {
      if (Array.isArray(t.showtimes)) {
        t.showtimes = t.showtimes.map((s) => ({
          ...s,
          startTime: new Date(s.startTime).toISOString()
        }));
      }
    });

    movie.releaseDate = movie.releaseDate
      ? new Date(movie.releaseDate).toISOString()
      : null;

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
