// routes/theaterRoutes.js

import express from 'express';
import {
  getTheaters,
  createTheater,
  updateTheater,
  deleteTheater,
} from '../controllers/theaterController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public Routes
router.get('/', getTheaters);
// ❌ Remove this route as it is no longer needed.
// router.get('/by-movie/:id', getTheatersByMovieId);

// Admin Routes (protected)
router.post('/', protect, adminOnly(), createTheater);
router.put('/:id', protect, adminOnly(), updateTheater);
router.delete('/:id', protect, adminOnly(), deleteTheater);

export default router;