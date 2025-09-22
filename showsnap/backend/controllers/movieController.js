// controllers/movieController.js

import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// ========================================
// Get All Movies
// ========================================
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

// ========================================
// Get Movie by ID
// ========================================
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Missing or invalid movie ID' });
    }

    const movie = await Movie.findById(id).lean();

    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const theaters = await Theater.find({ 'movies': id }).lean();

    const theatersWithMovieShowtimes = theaters.map(theater => {
        const movieShowtimes = theater.showtimes.filter(showtime =>
            // ✅ Add a null check to prevent crashing if showtime.movie is missing
            showtime.movie && showtime.movie.toString() === id.toString()
        );
        return {
            ...theater,
            showtimes: movieShowtimes
        };
    });

    movie.theaters = theatersWithMovieShowtimes;

    res.status(200).json(movie);
  } catch (err) {
    logger.error(`❌ Error fetching movie by ID: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movie' });
  }
};

// ========================================
// Create a new movie (Admin only)
// ========================================
export const createMovie = async (req, res) => {
  try {
    const { title, description, genre, releaseDate, posterUrl, trailerUrl, cast } = req.body;
    
    if (!title || !description || !releaseDate) {
      return res.status(400).json({ error: 'Title, description, and releaseDate are required.' });
    }

    const newMovie = new Movie({
      title,
      description,
      genre,
      releaseDate: new Date(releaseDate),
      posterUrl,
      trailerUrl,
      cast,
    });

    const savedMovie = await newMovie.save();
    logger.info(`✅ Movie created: ${savedMovie.title}`);
    res.status(201).json(savedMovie);
  } catch (err) {
    logger.error(`❌ Error creating movie: ${err.message}`);
    res.status(500).json({ error: 'Server error while creating movie' });
  }
};

// ========================================
// Update a movie (Admin only)
// ========================================
export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!updatedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    logger.info(`✅ Movie updated: ${updatedMovie.title}`);
    res.status(200).json(updatedMovie);
  } catch (err) {
    logger.error(`❌ Error updating movie: ${err.message}`);
    res.status(500).json({ error: 'Server error while updating movie' });
  }
};

// ========================================
// Delete a movie (Admin only)
// ========================================
export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    const deletedMovie = await Movie.findByIdAndDelete(id);
    
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    logger.info(`✅ Movie deleted: ${deletedMovie.title}`);
    res.status(200).json({ message: '✅ Movie deleted successfully' });
  } catch (err) {
    logger.error(`❌ Error deleting movie: ${err.message}`);
    res.status(500).json({ error: 'Server error while deleting movie' });
  }
};