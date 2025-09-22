// routes/movieRoutes.js

import express from 'express';
import {
  getMovies,
  getMovieById, // ✅ Make sure this is imported
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// 🎭 Public Routes
router.get('/', getMovies);
router.get('/:id', getMovieById); // ✅ This route is now used by BookMovie.jsx

// 🛠️ Admin Routes (protected)
router.post('/', protect, adminOnly(), createMovie);
router.put('/:id', protect, adminOnly(), updateMovie);
router.delete('/:id', protect, adminOnly(), deleteMovie);

export default router;