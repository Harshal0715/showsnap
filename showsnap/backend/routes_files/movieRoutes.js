import express from 'express';
import {
  getMovies,
  getMovieById
} from '../controllers/movieController.js';

import { createMovie } from '../controllers/adminController.js'; // ✅ Corrected Import

import protect from '../middleware/authMiddleware.js';    // 🔐 Auth middleware
import adminOnly from '../middleware/adminMiddleware.js'; // 🛡️ Admin check

const router = express.Router();

// =======================
// 🎬 Public Movie Routes
// =======================

// Get all movies with optional filters, pagination, sorting
router.get('/', getMovies);

// Get a single movie by ID
router.get('/:id', getMovieById);

// =======================
// 🆕 Admin Movie Routes
// =======================

// Create a new movie (admin only)
router.post('/', protect, adminOnly(), createMovie); // () allows role flexibility

export default router;