import axios from 'axios';

const supportedLanguages = ['en', 'hi', 'ta', 'te', 'ml', 'mr', 'kn', 'bn', 'gu', 'pa', 'ur'];

// 🔍 Search TMDB movies with language fallback
export const searchTmdbMovie = async (req, res) => {
  try {
    const rawQuery = req.query.query;
    const query = rawQuery?.split(':')[0].trim();
    if (!query) return res.status(400).json({ error: 'Missing query parameter' });

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API key not configured' });

    let results = [];
    for (const lang of supportedLanguages) {
      try {
        const tmdbRes = await axios.get('https://api.themoviedb.org/3/search/movie', {
          params: { api_key: apiKey, query, language: lang },
          timeout: 10000
        });
        if (tmdbRes.status === 200 && tmdbRes.data.results?.length > 0) {
          results = tmdbRes.data.results;
          break;
        }
      } catch (langErr) {
        console.warn(`TMDB search failed for language ${lang}:`, langErr.response?.data || langErr.message);
        continue;
      }
    }

    if (!results.length) {
      return res.status(404).json({ error: 'Movie not found in TMDB' });
    }
    res.status(200).json({ results });
  } catch (err) {
    console.error('❌ TMDB search error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
};

// 🎬 Fetch TMDB movie details + cast + trailer
export const getTmdbMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API key not configured' });

    const detailsUrl = `https://api.themoviedb.org/3/movie/${id}`;
    const creditsUrl = `https://api.themoviedb.org/3/movie/${id}/credits`;
    const videosUrl = `https://api.themoviedb.org/3/movie/${id}/videos`;

    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      axios.get(detailsUrl, { params: { api_key: apiKey, language: 'en' }, timeout: 10000 }),
      axios.get(creditsUrl, { params: { api_key: apiKey }, timeout: 10000 }),
      axios.get(videosUrl, { params: { api_key: apiKey, language: 'en' }, timeout: 10000 })
    ]);

    if (!detailsRes?.data || detailsRes.status !== 200) {
      return res.status(404).json({ error: 'Movie not found in TMDB' });
    }

    const details = detailsRes.data;

    // build genres and cast
    const genres = Array.isArray(details.genres)
      ? details.genres.map(g => g.name).filter(Boolean)
      : [];

    const cast = Array.isArray(creditsRes?.data?.cast)
      ? creditsRes.data.cast.slice(0, 10).map(c => ({
          name: c.name || '',
          role: c.character || '',
          photoUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ''
        }))
      : [];

    // 🔥 find YouTube trailer
    const videos = videosRes?.data?.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';

    res.status(200).json({
      title: details.title || '',
      description: details.overview || '',
      genre: genres.join(', '),
      rating: details.vote_average || 0,
      duration: `${details.runtime || 0} min`,
      posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
      trailerUrl,
      releaseDate: details.release_date || '',
      language: supportedLanguages.includes(details.original_language)
        ? details.original_language
        : 'en',
      cast
    });
  } catch (err) {
    console.error('❌ TMDB details fetch error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
};
