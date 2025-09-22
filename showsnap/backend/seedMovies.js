import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Movie from './models/Movie.js';
import Theater from './models/Theater.js';

dotenv.config();
const { TMDB_API_KEY, MONGO_URI } = process.env;

if (!TMDB_API_KEY || !MONGO_URI) {
  console.error('❌ Missing TMDB_API_KEY or MONGO_URI');
  process.exit(1);
}

// Movie titles to seed
const movieTitles = [
  'Oppenheimer', 'Barbie', 'Deadpool & Wolverine', 'Jawan',
  'Guardians of the Galaxy Vol. 3', 'Spider-Man: Across the Spider-Verse',
  'Thor: Love and Thunder', 'Animal', 'The Marvels',
  'Black Panther: Wakanda Forever', 'Ant-Man and the Wasp: Quantumania',
  'Mission: Impossible - Dead Reckoning Part One', 'Aquaman', 'The Flash',
  'Demon Slayer: Kimetsu no Yaiba Infinity Castle', 'The Conjuring: Last Rites',
  'Harry Potter and the Prisoner of Azkaban', 'F1', 'Final Destination Bloodlines',
  'Harry Potter and the Goblet of Fire'
];

// Retry wrapper
const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`🔁 Retry ${i + 1} for ${url}`);
      await new Promise(res => setTimeout(res, 1000));
    }
  }
};

// Fetch genres
async function fetchGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
  const data = await fetchWithRetry(url);
  return data.genres;
}

// Ensure theater exists or create
async function ensureTheater(name, location, showtimes) {
  let theater = await Theater.findOne({ name });
  if (!theater) {
    theater = await Theater.create({ name, location, showtimes });
  }
  return theater;
}

// Fetch movie data in English and Hindi if available
async function fetchMovieData(title, genreList) {
  try {
    // Fetch English first
    const searchUrlEN = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US`;
    const searchDataEN = await fetchWithRetry(searchUrlEN);
    const resultEN = searchDataEN.results?.[0];
    if (!resultEN) {
      console.warn(`❌ No English result for "${title}"`);
      return null;
    }

    const movieId = resultEN.id;

    // Trailer
    const videoData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    const trailer = videoData.results?.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

    // Cast
    const creditsData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
    const cast = creditsData.cast?.slice(0, 10).map(actor => ({
      name: actor.name,
      role: actor.character,
      photoUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : ''
    })) || [];

    // Duration & release date
    const detailsData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const duration = detailsData.runtime ? `${Math.floor(detailsData.runtime / 60)}h ${detailsData.runtime % 60}m` : 'N/A';
    const releaseDate = detailsData.release_date ? new Date(detailsData.release_date) : new Date();

    // Genres
    const genreNames = resultEN.genre_ids?.map(id => genreList.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'N/A';

    // Showtimes (sample)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const times = ['10:00', '13:30', '17:00', '21:30'];
    const showtimes = times.map(time => new Date(`${dateStr}T${time}:00`).toISOString());

    // Theaters
    const theatersData = [
      { name: 'PVR Phoenix Kurla', location: 'Mumbai', showtimes },
      { name: 'INOX R City', location: 'Ghatkopar', showtimes }
    ];

    const theaterRefs = [];
    for (const t of theatersData) {
      const theater = await ensureTheater(t.name, t.location, t.showtimes);
      theaterRefs.push(theater._id);
    }

    return {
      title: resultEN.title,
      description: resultEN.overview || 'No description available.',
      genre: genreNames,
      rating: resultEN.vote_average || 0,
      duration,
      posterUrl: resultEN.poster_path ? `https://image.tmdb.org/t/p/w500${resultEN.poster_path}` : '',
      trailerUrl,
      releaseDate,
      language: 'en',
      cast,
      theaters: theaterRefs,
      embeddedTheaters: theatersData
    };
  } catch (err) {
    console.error(`❌ Failed to fetch "${title}":`, err.message);
    return null;
  }
}

// Seed movies
async function seedMovies() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'showsnap' });
    console.log('✅ Connected to MongoDB');

    // Clear only movies
    await Movie.deleteMany();
    console.log('🧹 Cleared existing movies');

    const genreList = await fetchGenres();
    const movies = [];

    for (const title of movieTitles) {
      const movieData = await fetchMovieData(title, genreList);
      if (movieData) movies.push(movieData);
    }

    if (movies.length) {
      await Movie.insertMany(movies);
      console.log(`🎉 Seeded ${movies.length} movies successfully`);
    } else {
      console.warn('⚠️ No movies seeded');
    }
  } catch (err) {
    console.error('❌ Movie seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seedMovies();
