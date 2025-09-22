import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import logger from '../utils/logger.js';

const log = logger || console;

// 🎟️ Create booking (used after payment verification)
const createBooking = async ({
  userId,
  movieId,
  seats,
  theater,
  showtimeDate,
  amount,
  paymentStatus = 'paid'
}) => {
  if (!userId || !movieId || !seats?.length || !theater?.name || !theater?.location || !showtimeDate || !amount) {
    throw new Error('Missing or invalid booking data');
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(movieId)) {
    throw new Error('Invalid user or movie ID');
  }

  const [user, movie] = await Promise.all([
    User.findById(userId),
    Movie.findById(movieId)
  ]);

  if (!user || !movie) throw new Error('User or movie not found');

  const showtime = new Date(showtimeDate);
  const existingBookings = await Booking.find({
    movie: movieId,
    'theater.name': theater.name,
    showtimeDate: showtime,
    status: { $ne: 'cancelled' },
    seats: { $in: seats }
  });

  if (existingBookings.length > 0) {
    const bookedSeats = existingBookings.flatMap(b => b.seats);
    const conflictSeats = seats.filter(s => bookedSeats.includes(s));
    throw new Error(`Seats already booked: ${conflictSeats.join(', ')}`);
  }

  const booking = new Booking({
    user: userId,
    movie: movieId,
    seats,
    theater,
    showtimeDate: showtime,
    status: 'confirmed',
    amount,
    paymentStatus
  });

  await booking.save();
  log.info(`✅ Booking confirmed: ${booking._id}`);

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Booking Confirmed</h2>
      <p>Hi ${user.name},</p>
      <p>Your booking for <strong>${movie.title}</strong> is confirmed!</p>
      <ul>
        <li><strong>Theater:</strong> ${theater.name}</li>
        <li><strong>Location:</strong> ${theater.location}</li>
        <li><strong>Showtime:</strong> ${showtime.toLocaleString()}</li>
        <li><strong>Seats:</strong> ${seats.join(', ')}</li>
      </ul>
      <p>Enjoy your movie experience with <strong>ShowSnap</strong> 🍿</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: `Your ShowSnap Booking for ${movie.title}`,
      html: emailHTML
    });
  } catch (emailErr) {
    log.warn(`⚠️ Email failed to ${user.email}: ${emailErr.message}`);
  }

  return booking;
};

// 📄 Get all bookings for logged-in user
const getAllUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({ user: userId }).populate('movie');
    res.json({ count: bookings.length, bookings });
  } catch (err) {
    log.error(`❌ Error fetching user bookings: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching bookings' });
  }
};

// 🪑 Get booked seats
const getBookedSeats = async (req, res) => {
  try {
    const { movieId, theater, showtime } = req.query;
    if (!movieId || !theater || !showtime) {
      return res.status(400).json({ error: 'Missing query parameters' });
    }

    const showtimeDate = new Date(showtime);
    const bookings = await Booking.find({
      movie: movieId,
      'theater.name': theater,
      showtimeDate,
      status: { $ne: 'cancelled' }
    });

    const bookedSeats = bookings.flatMap(b => b.seats);
    res.json(bookedSeats);
  } catch (err) {
    log.error(`❌ Error fetching booked seats: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching booked seats' });
  }
};

// 🔍 Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(bookingId).populate('movie user');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    log.error(`❌ Error fetching booking by ID: ${err.message}`);
    res.status(500).json({ error: 'Server error while fetching booking' });
  }
};

// ❌ Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    log.error(`❌ Error cancelling booking: ${err.message}`);
    res.status(500).json({ error: 'Server error while cancelling booking' });
  }
};

export {
  createBooking,
  getBookedSeats,
  getAllUserBookings,
  getBookingById,
  cancelBooking
};
