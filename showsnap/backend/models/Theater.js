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
    showtimes: [
      {
        movie: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Movie',
          required: true
        },
        startTime: {
          type: Date,
          required: true,
          validate: {
            validator: date => date instanceof Date && !isNaN(date),
            message: 'Invalid showtime date'
          }
        },
        screen: {
          type: String,
          required: true,
          trim: true
        },
        availableSeats: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    movies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
      }
    ],
    movieTitles: {
      type: [String],
      default: []
    },
    screens: {
      type: [String],
      default: ['Screen 1']
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
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
theaterSchema.index({ 'showtimes.movie': 1 });
theaterSchema.index({ status: 1 });
theaterSchema.index({ name: 'text', location: 'text', movieTitles: 'text' });

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

// 🛠️ Update slug if name changes during update
theaterSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update?.name) {
    update.slug = update.name.toLowerCase().trim().replace(/\s+/g, '-');
    this.setUpdate(update);
  }
  next();
});

export default mongoose.model('Theater', theaterSchema);