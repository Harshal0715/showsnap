// models/Theater.js

import mongoose from 'mongoose';

// 🏢 Theater schema
const theaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true,
      unique: true
    },
    location: {
      type: String,
      required: [true, 'Theater location is required'],
      trim: true
    },
    // ✅ Change: store showtimes as a separate, more detailed sub-document
    showtimes: [
      {
        movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
        startTime: { type: Date, required: true },
        screen: { type: String, required: true, trim: true },
        availableSeats: { type: Number, required: true, min: 0 },
      }
    ],
    // ✅ Change: reference movies by their Object ID for a proper relationship
    movies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
      }
    ],
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 🔍 Indexes for faster queries
theaterSchema.index({ location: 1 });
theaterSchema.index({ name: 1 });
theaterSchema.index({ slug: 1 });
theaterSchema.index({ 'showtimes.movie': 1 }); // ✅ New index

// 🧼 Normalize name and generate slug before saving
theaterSchema.pre('save', function (next) {
  if (this.name) {
    this.name = this.name.trim();
    if (!this.slug) {
      this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
    }
  }
  next();
});

// Optional: update slug on name change
theaterSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update?.name) {
    update.slug = update.name.toLowerCase().trim().replace(/\s+/g, '-');
    this.setUpdate(update);
  }
  next();
});

export default mongoose.model('Theater', theaterSchema);