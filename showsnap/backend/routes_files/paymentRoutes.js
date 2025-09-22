import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  createOrder,
  verifyPayment
} from '../controllers/razorpayController.js';

const router = express.Router();

// 💳 Razorpay Payment Routes
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// Optional: Razorpay webhook route
// router.post('/webhook', razorpayWebhookHandler);

export default router;
