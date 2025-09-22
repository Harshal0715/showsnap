// controllers/theaterController.js

import Theater from '../models/Theater.js';
import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * GET /api/theaters
 * Fetch all theaters with optional filters
 */
export const getTheaters = async (req, res) => {
  try {
    const { location, name } = req.query;
    const query = {};

    if (location?.trim()) query.location = { $regex: location.trim(), $options: 'i' };
    if (name?.trim()) query.name = { $regex: name.trim(), $options: 'i' };

    const theaters = await Theater.find(query).populate('movies', 'title posterUrl');
    logger.info(`🎭 Fetched ${theaters.length} theaters`);

    res.status(200).json({ count: theaters.length, theaters });
  } catch (err) {
    logger.error(`❌ Error fetching theaters: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching theaters' });
  }
};

/**
 * GET /api/theaters/by-movie/:id
 * Fetch theaters and their showtimes for a specific movie ID
 */
export const getTheatersByMovieId = async (req, res) => {
  try {
    const { id } = req.params; // ✅ Using 'id' to match the route

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const theaters = await Theater.find({ movies: id }).lean();

    if (!theaters.length) {
      return res.status(404).json({ message: `No theaters found for this movie.` });
    }
    
    const theatersWithShowtimes = theaters.map(theater => {
      const movieShowtimes = theater.showtimes.filter(showtime =>
        showtime.movie.toString() === id && new Date(showtime.startTime) > new Date()
      );
      return {
        ...theater,
        showtimes: movieShowtimes
      };
    }).filter(t => t.showtimes.length > 0);

    res.status(200).json({ count: theatersWithShowtimes.length, theaters: theatersWithShowtimes });
  } catch (err) {
    logger.error(`❌ Error fetching theaters by movie ID: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching theaters by movie ID' });
  }
};

/**
 * POST /api/theaters (Admin only)
 * Create a new theater
 */
export const createTheater = async (req, res) => {
  try {
    const { name, location, showtimes, movies } = req.body;

    if (!name?.trim() || !location?.trim() || !movies?.length) {
      return res.status(400).json({ error: 'Name, location, and at least one movie are required' });
    }

    if (!Array.isArray(movies) || !movies.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'movies must be an array of valid ObjectIds' });
    }

    const movieCount = await Movie.countDocuments({ _id: { $in: movies } });
    if (movieCount !== movies.length) {
      return res.status(400).json({ error: 'One or more movie IDs are invalid' });
    }
    
    if (!Array.isArray(showtimes) || showtimes.length === 0) {
      return res.status(400).json({ error: 'At least one showtime is required' });
    }
    for (const st of showtimes) {
      if (!st.movie || !st.startTime || !st.screen) {
        return res.status(400).json({ error: 'Each showtime must have a movie, startTime, and screen' });
      }
    }

    const existing = await Theater.findOne({ name: name.trim(), location: location.trim() });
    if (existing) return res.status(409).json({ error: 'Theater already exists at this location' });

    const newTheater = new Theater({
      name: name.trim(),
      location: location.trim(),
      showtimes,
      movies,
    });

    const saved = await newTheater.save();
    logger.info(`✅ Theater created: ${saved.name}`);

    res.status(201).json({ message: '✅ Theater created successfully', theater: saved });
  } catch (err) {
    logger.error(`❌ Error creating theater: ${err.message}`);
    res.status(500).json({ error: 'Server error while creating theater' });
  }
};

/**
 * PUT /api/theaters/:id (Admin only)
 * Update an existing theater
 */
export const updateTheater = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name) updates.name = updates.name.trim();
    if (updates.location) updates.location = updates.location.trim();
    
    if (updates.movies && !Array.isArray(updates.movies)) {
      return res.status(400).json({ error: 'movies must be an array' });
    }

    const updated = await Theater.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updated) return res.status(404).json({ error: 'Theater not found' });

    res.status(200).json({ message: '✅ Theater updated successfully', theater: updated });
  } catch (err) {
    logger.error(`❌ Error updating theater: ${err.message}`);
    res.status(500).json({ error: 'Server error while updating theater' });
  }
};

/**
 * DELETE /api/theaters/:id (Admin only)
 * Delete a theater
 */
export const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Theater.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: 'Theater not found' });

    res.status(200).json({ message: '✅ Theater deleted successfully' });
  } catch (err) {
    logger.error(`❌ Error deleting theater: ${err.message}`);
    res.status(500).json({ error: 'Server error while deleting theater' });
  }
};