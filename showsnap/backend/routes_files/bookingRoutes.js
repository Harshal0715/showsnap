import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  getBookingById,
  getBookedSeats,
  getAllUserBookings,
  cancelBooking // ✅ Import the cancel handler
} from '../controllers/bookingController.js';

const router = express.Router();

// 🪑 Booking Routes
router.get('/booked-seats', getBookedSeats); // Public route
router.get('/my-bookings', protect, getAllUserBookings); // Protected route
router.get('/:bookingId', protect, getBookingById); // Get booking by ID
router.patch('/:bookingId/cancel', protect, cancelBooking); // ✅ Cancel booking route

export default router;
