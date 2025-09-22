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
    showtimes: {
      type: [Date],
      required: [true, 'At least one showtime is required'],
      validate: {
        validator: (dates) =>
          Array.isArray(dates) &&
          dates.length > 0 &&
          dates.every((date) => date instanceof Date && !isNaN(date)),
        message: 'Showtimes must include valid future dates'
      }
    },
    movieTitles: {
      type: [String],
      default: [],
      validate: {
        validator: (titles) =>
          Array.isArray(titles) &&
          titles.every((title) => typeof title === 'string' && title.trim().length > 0),
        message: 'movieTitles must be an array of non-empty strings'
      }
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true // allows null but enforces uniqueness when present
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
