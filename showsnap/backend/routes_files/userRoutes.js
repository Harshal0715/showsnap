import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  forgotPassword 
} from '../controllers/userController.js';

const router = express.Router();

// =======================
// 👤 Public User Routes
// =======================
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword); // ✅ New public route

// =======================
// 🔐 Protected User Routes
// =======================
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;