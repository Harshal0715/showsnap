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

const movieTitlesToSeed = [
  'Oppenheimer', 'Barbie', 'Jawan', 'Guardians of the Galaxy Vol. 3', 'Spider-Man: Across the Spider-Verse',
  'Avatar: Fire and Ash', 'The Conjuring: Last Rites', 'Demon Slayer: Kimetsu no Yaiba Infinity Castle',
  'F1', 'Final Destination Bloodlines', 'Harry Potter and the Prisoner of Azkaban', 'Harry Potter and the Goblet of Fire'
];

const supportedTmdbLanguages = [ // TMDB specific full codes for searching
  'en-US', 'hi-IN', 'mr-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN', 'bn-IN', 'gu-IN', 'pa-IN', 'ur-PK'
];

const backendSupportedLanguages = [ // Your backend's 2-letter codes for storing in DB
  'en', 'hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur' 
];

const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn(`⚠️ 404 Not Found for ${url}`);
        return null; // Return null for 404s
      }
      if (i === retries - 1) {
        console.error(`❌ Failed after ${retries} retries for ${url}: ${err.message}`);
        throw err;
      }
      console.warn(`🔁 Retry ${i + 1} for ${url} (Error: ${err.message})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

async function fetchGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
  const data = await fetchWithRetry(url);
  return data?.genres || [];
}

async function ensureTheater(name, location, defaultShowtimeDates) {
  let theater = await Theater.findOne({ name, location });
  if (!theater) {
    theater = await Theater.create({ name, location, showtimes: defaultShowtimeDates });
  }
  // Ensure the theater's showtimes are up-to-date or set if new
  if (!theater.showtimes || theater.showtimes.length === 0) {
    theater.showtimes = defaultShowtimeDates;
    await theater.save();
  }
  return theater;
}

async function searchMovieInLanguages(title) {
  for (const lang of supportedTmdbLanguages) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=${lang}`;
    const data = await fetchWithRetry(url);
    const result = data?.results?.[0];
    if (result) {
      const languageCode = lang.split('-')[0];
      if (backendSupportedLanguages.includes(languageCode)) {
        return { result, language: languageCode };
      }
    }
  }
  return null;
}

async function fetchMovieData(title, genreList) {
  try {
    const searchResult = await searchMovieInLanguages(title);
    if (!searchResult) {
      console.warn(`⚠️ No TMDB search result found for "${title}" in supported languages.`);
      return null;
    }

    const { result, language } = searchResult;
    const movieId = result.id;

    const videoData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    const trailer = videoData?.results?.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

    const creditsData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
    const cast = creditsData?.cast?.slice(0, 10).map(actor => ({
      name: actor.name,
      role: actor.character,
      photoUrl: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : ''
    })) || [];

    const detailsData = await fetchWithRetry(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`);
    const duration = detailsData?.runtime ? `${Math.floor(detailsData.runtime / 60)}h ${detailsData.runtime % 60}m` : 'N/A';
    const releaseDate = detailsData?.release_date ? new Date(detailsData.release_date) : new Date();
    const genreNames = result.genre_ids?.map(id => genreList.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
    
    const status = releaseDate > new Date() ? 'Coming Soon' : 'Now Showing';

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const times = ['10:00', '13:30', '17:00', '21:30'];
    const showtimesForTheaters = times.map(time => new Date(`${dateStr}T${time}:00`).toISOString());

    const theatersData = [
      { name: 'PVR Phoenix Kurla', location: 'Mumbai', showtimes: showtimesForTheaters },
      { name: 'INOX R City', location: 'Ghatkopar', showtimes: showtimesForTheaters }
    ];

    const theaterRefs = [];
    const embeddedTheaters = [];

    for (const t of theatersData) {
      const theater = await ensureTheater(t.name, t.location, t.showtimes.map(s => new Date(s))); // Convert back to Date objects
      theaterRefs.push(theater._id);
      embeddedTheaters.push({
        name: t.name,
        location: t.location,
        showtimes: t.showtimes.map(s => new Date(s))
      });

      // Update the Theater document to link to this movie title
      // We will only add movieTitles if the movie is "Now Showing" for simplicity in the seed.
      if (status === 'Now Showing') {
        await Theater.findByIdAndUpdate(
          theater._id, 
          { $addToSet: { movieTitles: result.title } }, // Add movie title to the theater's list
          { new: true, upsert: false }
        );
      }
    }

    return {
      title: result.title,
      description: result.overview || 'No description available.',
      genre: genreNames,
      rating: result.vote_average || 0,
      duration,
      posterUrl: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : '',
      trailerUrl,
      releaseDate,
      language,
      tags: [],
      isFeatured: false,
      status, 
      cast,
      theaters: theaterRefs, 
      embeddedTheaters 
    };
  } catch (err) {
    console.error(`❌ Failed to process TMDB data for "${title}":`, err.message);
    return null;
  }
}

async function seedMovies() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'showsnap' });
    console.log('✅ Connected to MongoDB');

    await Movie.deleteMany();
    // Clear movieTitles from existing theaters only, don't delete theaters entirely
    await Theater.updateMany({}, { $set: { movieTitles: [], showtimes: [] } }); 
    console.log('🧹 Cleared existing movies and reset theater movie titles/showtimes');

    const genreList = await fetchGenres();
    const moviesToInsert = [];

    for (const title of movieTitlesToSeed) {
      const movieData = await fetchMovieData(title, genreList);
      if (movieData) moviesToInsert.push(movieData);
    }

    if (moviesToInsert.length) {
      await Movie.insertMany(moviesToInsert);
      console.log(`🎉 Seeded ${moviesToInsert.length} movies successfully`);
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