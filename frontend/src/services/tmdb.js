import axios from 'axios';

const TMDB_API_KEY = '43e52c17e3540a628d12e38fd32b0ac9';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const searchMovie = async (query) => {
  const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: { api_key: TMDB_API_KEY, query }
  });
  return res.data.results;
};

export const getMovieDetails = async (movieId) => {
  const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
    params: { api_key: TMDB_API_KEY }
  });
  return res.data;
};

export const getMovieCredits = async (movieId) => {
  const res = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits`, {
    params: { api_key: TMDB_API_KEY }
  });
  return res.data.cast;
};

export const buildImageUrl = (path) => `${TMDB_IMAGE_BASE}${path}`;
