// frontend/src/services/tmdb.js
import axios from 'axios';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY; // Must start with REACT_APP_
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Search movies
export const searchMovie = async (query) => {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query }
    });
    return res.data.results;
  } catch (err) {
    console.error('❌ Failed to fetch movies', err);
    throw new Error('Failed to fetch movies');
  }
};

// Get movie details
export const getMovieDetails = async (movieId) => {
  const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
    params: { api_key: TMDB_API_KEY }
  });
  return res.data;
};

// Get cast
export const getMovieCredits = async (movieId) => {
  const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
    params: { api_key: TMDB_API_KEY }
  });
  return res.data.cast;
};

// Build poster URL
export const buildImageUrl = (path) => (path ? `${TMDB_IMAGE_BASE}${path}` : '');
