import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Movie from './models/Movie.js';
import Theater from './models/Theater.js';

dotenv.config();
const { TMDB_API_KEY, MONGO_URI } = process.env;

const movieTitlesToSeed = [
  'Oppenheimer', 'Barbie', 'Jawan', 'Guardians of the Galaxy Vol. 3',
  'Spider-Man: Across the Spider-Verse', 'Avatar: Fire and Ash',
  'The Conjuring: Last Rites', 'Demon Slayer: Kimetsu no Yaiba Infinity Castle',
  'F1', 'Final Destination Bloodlines', 'Harry Potter and the Prisoner of Azkaban',
  'Harry Potter and the Goblet of Fire', 'Avengers: Doomsday', 'The Batman Beyond'
];

const supportedTmdbLanguages = ['en-US', 'hi-IN', 'mr-IN', 'ta-IN', 'te-IN', 'ml-IN', 'kn-IN', 'bn-IN', 'gu-IN', 'pa-IN', 'ur-PK'];
const backendSupportedLanguages = ['en', 'hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur'];

const seatRows = ['A', 'B', 'C', 'D'];
const seatCols = [1, 2, 3, 4, 5, 6];
const allSeats = seatRows.flatMap(row => seatCols.map(col => `${row}${col}`));

function generateBlockedSeats() {
  const total = Math.floor(Math.random() * 10); // block 0–10 seats
  const shuffled = [...allSeats].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, total);
}

const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

async function fetchGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
  const data = await fetchWithRetry(url);
  return data?.genres || [];
}

async function ensureTheater(name, location) {
  let theater = await Theater.findOne({ name, location });
  if (!theater) {
    theater = await Theater.create({ name, location, showtimes: [], movieTitles: [] });
  } else {
    theater.showtimes = [];
    theater.movieTitles = [];
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
  const searchResult = await searchMovieInLanguages(title);
  if (!searchResult) return null;

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
  const duration = detailsData?.runtime ? `${detailsData.runtime} min` : 'N/A';
  const releaseDate = detailsData?.release_date ? new Date(detailsData.release_date) : new Date();
  const genreNames = result.genre_ids?.map(id => genreList.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'N/A';
  const status = releaseDate > new Date() ? 'Coming Soon' : 'Now Showing';

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
    theaters: [],
    embeddedTheaters: []
  };
}

async function seedMovies() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'showsnap' });
    console.log('✅ Connected to MongoDB');

    await Movie.deleteMany();
    await Theater.updateMany({}, { $set: { movieTitles: [], showtimes: [] } });
    console.log('🧹 Cleared existing movies and reset theater movie titles/showtimes');

    const genreList = await fetchGenres();
    const moviesToInsert = [];

    for (const title of movieTitlesToSeed) {
      const movieData = await fetchMovieData(title, genreList);
      if (movieData) moviesToInsert.push(movieData);
    }

    const insertedMovies = await Movie.insertMany(moviesToInsert);
    console.log(`🎉 Seeded ${insertedMovies.length} movies successfully`);

    const theaterList = [
      { name: 'PVR Phoenix Kurla', location: 'Mumbai' },
      { name: 'INOX R City', location: 'Ghatkopar' },
      { name: 'NY Cinemas Mulund', location: 'Mulund' },
      { name: 'R Mall Mulund', location: 'Mulund' }
    ];

    const times = ['10:00', '13:30', '17:00', '21:30'];
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    for (const movie of insertedMovies) {
      const updatedTheaters = [];
      const embedded = [];

      for (const { name, location } of theaterList) {
        const theater = await ensureTheater(name, location);

        const showtimes = times.map(time => ({
          startTime: new Date(`${dateStr}T${time}:00`),
          screen: 'Screen 1',
          availableSeats: 100,
          blockedSeats: generateBlockedSeats(),
          movie: movie._id
        }));

        await Theater.updateOne(
          { _id: theater._id },
          {
            $push: { showtimes: { $each: showtimes } },
            $addToSet: { movieTitles: movie.title }
          }
        );

        updatedTheaters.push(theater._id);
        embedded.push({
          name: theater.name,
          location: theater.location,
          showtimes
        });
      }

      await Movie.findByIdAndUpdate(movie._id, {
        $set: {
          theaters: updatedTheaters,
          embeddedTheaters: embedded
        }
      });
    }

    console.log('✅ Finished linking movies & theaters with showtimes');
  } catch (err) {
    console.error('❌ Movie seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seedMovies();
