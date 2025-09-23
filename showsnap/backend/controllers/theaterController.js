import Theater from '../models/Theater.js';
import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';

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

    const theaters = await Theater.find(query);
    logger.info(`🎭 Fetched ${theaters.length} theaters`);

    res.status(200).json({ count: theaters.length, theaters });
  } catch (err) {
    logger.error(`❌ Error fetching theaters: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching theaters' });
  }
};

/**
 * GET /api/theaters/by-movie/:id
 * Fetch theaters showing a specific movie by ID
 */
export const getTheatersByMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const theaters = await Theater.find({ movies: id }).lean();

    const filtered = theaters.map(t => ({
      _id: t._id,
      name: t.name,
      location: t.location,
      showtimes: t.showtimes
        .filter(s => s.movie?.toString() === id.toString())
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .map(s => ({
          _id: s._id,
          startTime: s.startTime,
          screen: s.screen,
          availableSeats: s.availableSeats
        }))
    }));

    res.status(200).json({ count: filtered.length, theaters: filtered });
  } catch (err) {
    logger.error(`❌ Error fetching theaters by movie: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching theaters by movie' });
  }
};

/**
 * POST /api/theaters (Admin only)
 * Create a new theater
 */
export const createTheater = async (req, res) => {
  try {
    const { name, location, showtimes, movies = [], movieTitles = [] } = req.body;

    if (!name?.trim() || !location?.trim() || !Array.isArray(showtimes) || showtimes.length === 0) {
      return res.status(400).json({ error: 'Name, location and at least one showtime are required' });
    }

    const existing = await Theater.findOne({ name: name.trim(), location: location.trim() });
    if (existing) return res.status(409).json({ error: 'Theater already exists at this location' });

    const normalizedShowtimes = showtimes.map(s => ({
      movie: s.movie,
      startTime: new Date(s.startTime),
      screen: s.screen || 'Screen 1',
      availableSeats: s.availableSeats || 100
    }));

    const newTheater = new Theater({
      name: name.trim(),
      location: location.trim(),
      showtimes: normalizedShowtimes,
      movies,
      movieTitles
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

    if (Array.isArray(updates.showtimes)) {
      updates.showtimes = updates.showtimes.map(s => ({
        movie: s.movie,
        startTime: new Date(s.startTime),
        screen: s.screen || 'Screen 1',
        availableSeats: s.availableSeats || 100
      }));
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