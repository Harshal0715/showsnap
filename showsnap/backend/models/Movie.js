import mongoose from 'mongoose';

// 🎭 Cast member schema
const castSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cast member name is required'],
      trim: true
    },
    role: {
      type: String,
      trim: true,
      default: 'Actor'
    },
    photoUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/, 'Invalid photo URL'],
      default: ''
    }
  },
  { _id: false }
);

// 🎟️ Embedded theater schema (for frontend rendering)
const embeddedTheaterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theater name is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Theater location is required'],
      trim: true
    },
    showtimes: {
      type: [Date],
      default: [],
      validate: {
        validator: arr => Array.isArray(arr),
        message: 'Showtimes must be an array of dates'
      }
    }
  },
  { _id: false }
);

// 🎬 Movie schema
const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: 'No description available.'
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    duration: {
      type: String,
      trim: true,
      default: 'N/A'
    },
    posterUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/, 'Invalid poster URL']
    },
    trailerUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Invalid trailer URL'],
      default: ''
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
      validate: {
        validator: date => date instanceof Date && !isNaN(date),
        message: 'Release date must be a valid date'
      }
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    cast: {
      type: [castSchema],
      default: []
    },

    // ✅ Referenced theaters (for admin control)
    theaters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theater'
    }],

    // ✅ Embedded theaters (for frontend rendering)
    embeddedTheaters: {
      type: [embeddedTheaterSchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 🔍 Indexes for performance and text search
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isFeatured: 1 });
movieSchema.index({ title: 'text', description: 'text', genre: 'text', tags: 'text' });

// 🧼 Normalize title before saving
movieSchema.pre('save', function (next) {
  if (this.title) this.title = this.title.trim();
  next();
});

export default mongoose.model('Movie', movieSchema, 'movies');