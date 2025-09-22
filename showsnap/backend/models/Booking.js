import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    seats: { type: [String], required: true },
    theater: {
      name: { type: String, required: true, trim: true },
      location: { type: String, required: true, trim: true }
    },
    showtimeDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid', 'failed'], default: 'paid' }
  },
  { timestamps: true }
);

// Optimize seat availability checks
bookingSchema.index({ movie: 1, showtimeDate: 1 });

export default mongoose.model('Booking', bookingSchema);
