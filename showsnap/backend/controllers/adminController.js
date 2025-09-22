import Movie from '../models/Movie.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const log = logger || console;

// 🆕 Create a new movie
export const createMovie = async (req, res) => {
  try {
    const {
      title, description, genre, rating, duration,
      posterUrl, trailerUrl, releaseDate, language,
      cast, theaters = []
    } = req.body;

    const required = { title, genre, posterUrl, releaseDate, language };
    const missing = Object.entries(required)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    if (!Array.isArray(theaters)) {
      return res.status(400).json({ error: 'Theaters must be an array' });
    }

    theaters.forEach(t => {
      t.showtimes = t.showtimes?.map(s => new Date(s));
    });

    const movie = new Movie({
      title, description, genre, rating, duration,
      posterUrl, trailerUrl, releaseDate, language,
      cast, theaters
    });

    await movie.save();
    log.info(`🎬 Movie created: ${title}`);
    res.status(201).json({ message: '✅ Movie created', movie });
  } catch (err) {
    log.error(`❌ Movie creation failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while creating movie' });
  }
};

// ✏️ Update movie
export const updateMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    const updated = await Movie.findByIdAndUpdate(movieId, updates, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ error: 'Movie not found' });

    log.info(`✏️ Movie updated: ${updated.title}`);
    res.json({ message: '✅ Movie updated', movie: updated });
  } catch (err) {
    log.error(`❌ Movie update failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while updating movie' });
  }
};

// 🗑️ Delete movie
export const deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    if (!movieId) return res.status(400).json({ error: 'Missing movie ID' });

    const deleted = await Movie.findByIdAndDelete(movieId);
    if (!deleted) return res.status(404).json({ error: 'Movie not found' });

    log.info(`🗑️ Movie deleted: ${deleted.title}`);
    res.json({ message: '✅ Movie deleted', deleted });
  } catch (err) {
    log.error(`❌ Movie deletion failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while deleting movie' });
  }
};

// 📦 Bulk create movies
export const bulkCreateMovies = async (req, res) => {
  try {
    const { movies } = req.body;
    if (!Array.isArray(movies) || movies.length === 0) {
      return res.status(400).json({ error: 'No movies provided' });
    }

    const created = await Movie.insertMany(movies, { ordered: false });
    log.info(`📦 Bulk movies created: ${created.length}`);
    res.status(201).json({ message: '✅ Bulk movies created', movies: created });
  } catch (err) {
    log.error(`❌ Bulk creation failed: ${err.message}`);
    res.status(500).json({ error: 'Server error during bulk movie creation' });
  }
};

// 📄 Get bookings (admin only)
export const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { userId, movieId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (userId) query.user = userId;
    if (movieId) query.movie = movieId;

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('movie')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);
    res.json({ count: bookings.length, total, page: Number(page), bookings });
  } catch (err) {
    log.error(`❌ Booking fetch failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching bookings' });
  }
};

// 👥 Get users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { page = 1, limit = 50 } = req.query;

    const users = await User.find()
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments();
    res.json({ count: users.length, total, page: Number(page), users });
  } catch (err) {
    log.error(`❌ User fetch failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
};

// 📊 Admin stats (admin only)
export const getAdminStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    log.info(`📊 Admin stats requested by ${req.user.email}`);

    const [users, bookings, movies] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Movie.countDocuments()
    ]);

    res.json({ users, bookings, movies });
  } catch (err) {
    log.error(`❌ Stats fetch failed: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching stats' });
  }
};

// 🎬 Get single movie
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    log.error(`❌ Failed to fetch movie: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movie' });
  }
};

// 📚 Get all movies
export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ releaseDate: -1 });
    res.json({ count: movies.length, movies });
  } catch (err) {
    log.error(`❌ Failed to fetch movies: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching movies' });
  }
};

// 🛠 Ping admin (optional health check)
export const pingAdmin = (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ message: 'Admin access verified' });
};
