import express from 'express';
import {
  getTheaters,
  getTheatersByMovie,
  createTheater,
  updateTheater,
  deleteTheater,
} from '../controllers/theaterController.js';
import protect from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminMiddleware.js';

const router = express.Router();

// 🎭 Public Routes
router.get('/', getTheaters);
router.get('/by-movie/:title', getTheatersByMovie);

// 🛠️ Admin Routes (protected)
router.post('/', protect, adminOnly(), createTheater);
router.put('/:id', protect, adminOnly(), updateTheater);
router.delete('/:id', protect, adminOnly(), deleteTheater);

export default router;
