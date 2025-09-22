import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';

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

    if (isUpcoming === 'true') {
      query.releaseDate = { $gt: today };
    } else {
      query.releaseDate = { $lte: today };
    }

    if (genre?.trim())
      query.genre = { $regex: genre.trim(), $options: 'i' };
    if (minRating && !isNaN(minRating))
      query.rating = { $gte: parseFloat(minRating) };
    if (language?.trim())
      query.language = { $regex: language.trim(), $options: 'i' };
    if (releasedAfter && !isNaN(Date.parse(releasedAfter)))
      query.releaseDate = { $gte: new Date(releasedAfter) };
    
    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    if (sortBy === 'releaseDate') sortOptions.releaseDate = -1;

    const movies = await Movie.find(query)
      .populate('theaters', 'name location showtimes')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    
    const total = await Movie.countDocuments(query);

    res.status(200).json({
      count: movies.length,
      total,
      page: Number(page),
      movies,
    });
  } catch (err) {
    logger.error(`❌ Error fetching movies: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movies' });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({ error: 'Missing or invalid movie ID' });
    }

    const movie = await Movie.findById(id)
      .populate('theaters', 'name location showtimes')
      .lean();

    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    movie.theaters?.forEach((t) => {
      if (t.showtimes) {
        t.showtimes = t.showtimes.map((s) => new Date(s).toISOString());
      }
    });

    movie.releaseDate = movie.releaseDate
      ? new Date(movie.releaseDate).toISOString()
      : null;

    res.status(200).json(movie);
  } catch (err) {
    logger.error(`❌ Error fetching movie by ID: ${err.message}`);
    res
      .status(500)
      .json({ error: 'Server error while fetching movie' });
  }
};