import express from 'express';
import {
  createMovie,
  deleteMovie,
  getAllBookings,
  getAdminStats,
  bulkCreateMovies,
  updateMovie,
  getAllUsers,
  getMovieById,
  getAllMovies,
  pingAdmin // ✅ Optional health check route
} from '../controllers/adminController.js';
import { searchTmdbMovie } from '../controllers/tmdbController.js';
import { getTmdbMovieDetails } from '../controllers/tmdbController.js';

import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// 🧩 Middleware chain for admin access
const adminAccess = [protect, adminOnly()];

// 🎬 Movie Management Routes
router.post('/movies', ...adminAccess, createMovie);
router.post('/movies/bulk', ...adminAccess, bulkCreateMovies);
router.put('/movies/:movieId', ...adminAccess, updateMovie);
router.delete('/movies/:movieId', ...adminAccess, deleteMovie);

// 📄 Movie Viewing Routes
router.get('/movies/:id', ...adminAccess, getMovieById);
router.get('/movies', ...adminAccess, getAllMovies);

// 📄 Booking Insights Route
router.get('/bookings', ...adminAccess, getAllBookings);

// 📊 Dashboard Metrics Route
router.get('/dashboard', ...adminAccess, getAdminStats);

// 👥 User Management Route
router.get('/users', ...adminAccess, getAllUsers);

// 🛠 Admin Health Check (Optional)
router.get('/ping', ...adminAccess, pingAdmin); // ✅ Useful for frontend token validation

router.get('/tmdb/search', ...adminAccess, adminOnly(), searchTmdbMovie);
router.get('/tmdb/movie/:id', ...adminAccess, getTmdbMovieDetails);

export default router;
