import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  searchMovie,
  getMovieDetails,
  getMovieCredits,
  buildImageUrl
} from '../../services/tmdb';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AddMovie() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 🎬 Movie info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('');
  const [duration, setDuration] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [language, setLanguage] = useState('');

  // 🎭 Cast
  const [cast, setCast] = useState([]);
  const [castName, setCastName] = useState('');
  const [castRole, setCastRole] = useState('');
  const [castPhotoUrl, setCastPhotoUrl] = useState('');

  // 🏢 Theaters
  const [availableTheaters, setAvailableTheaters] = useState([]);
  const [selectedTheaterIds, setSelectedTheaterIds] = useState([]);

  // 🔍 TMDB Search
  const [tmdbQuery, setTmdbQuery] = useState('');

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/theaters`);
        setAvailableTheaters(res.data.theaters);
      } catch (err) {
        console.error('❌ Error fetching theaters:', err);
        toast.error('Failed to load theaters');
      }
    };
    fetchTheaters();
  }, []);

  const addCastMember = () => {
    if (!castName.trim() || !castRole.trim()) {
      toast.error('Cast name and role are required');
      return;
    }
    if (cast.find(c => c.name.toLowerCase() === castName.toLowerCase())) {
      toast.error('Cast member already added');
      return;
    }
    setCast(prev => [...prev, { name: castName.trim(), role: castRole.trim(), photoUrl: castPhotoUrl.trim() }]);
    setCastName('');
    setCastRole('');
    setCastPhotoUrl('');
    toast.success('🎭 Cast added!');
  };

  const handleTheaterChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedTheaterIds(selected);
  };

  const handleTmdbSearch = async () => {
    try {
      const results = await searchMovie(tmdbQuery);
      if (!results.length) return toast.error('No results found');

      const movie = results[0];
      const details = await getMovieDetails(movie.id);
      const castList = await getMovieCredits(movie.id);

      setTitle(details.title);
      setDescription(details.overview);
      setGenre(details.genres.map(g => g.name).join(', '));
      setRating(details.vote_average);
      setDuration(`${details.runtime} min`);
      setPosterUrl(buildImageUrl(details.poster_path));
      setTrailerUrl(`https://www.youtube.com/results?search_query=${details.title}+trailer`);
      setReleaseDate(details.release_date);
      setLanguage(details.original_language);

      const topCast = castList.slice(0, 5).map(c => ({
        name: c.name,
        role: c.character,
        photoUrl: buildImageUrl(c.profile_path)
      }));
      setCast(topCast);

      toast.success(`🎬 Loaded ${details.title} from TMDB`);
    } catch (err) {
      console.error('TMDB fetch error:', err);
      toast.error('Failed to fetch from TMDB');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !genre.trim() || !posterUrl.trim() || !releaseDate || !language.trim()) {
      toast.error('Please fill all required movie fields');
      return;
    }

    const newMovie = {
      title: title.trim(),
      description: description.trim(),
      genre: genre.trim(),
      rating: parseFloat(rating) || 0,
      duration: duration.trim(),
      posterUrl: posterUrl.trim(),
      trailerUrl: trailerUrl.trim(),
      releaseDate: new Date(releaseDate).toISOString(),
      language: language.trim(),
      cast,
      theaters: availableTheaters.filter(t => selectedTheaterIds.includes(t._id))
    };

    try {
      await axios.post(`${API_URL}/api/admin/movies`, newMovie, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('🎉 Movie added successfully!');
      navigate('/admin');
    } catch (err) {
      console.error('❌ Error adding movie:', err.response?.data || err.message);
      toast.error('Failed to add movie');
    }
  };

  const inputClass = 'input bg-gray-800 text-white rounded px-3 py-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-red-500">🎬 Add New Movie</h2>

      {/* TMDB Search */}
      <section className="mb-6">
        <input
          type="text"
          placeholder="Search TMDB..."
          value={tmdbQuery}
          onChange={e => setTmdbQuery(e.target.value)}
          className={inputClass}
        />
        <button
          onClick={handleTmdbSearch}
          className="btn bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white mt-2"
        >
          🔍 Fetch from TMDB
        </button>
      </section>

      {/* Movie Info */}
      <section className="mb-6 grid gap-2">
        <input type="text" placeholder="Title*" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Genre*" value={genre} onChange={e => setGenre(e.target.value)} className={inputClass} />
        <input type="number" placeholder="Rating (0–10)" value={rating} onChange={e => setRating(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Duration (e.g. 2h 15m)" value={duration} onChange={e => setDuration(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Poster URL*" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Trailer URL" value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} className={inputClass} />
        <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Language*" value={language} onChange={e => setLanguage(e.target.value)} className={inputClass} />
      </section>

      {/* Cast */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🎭 Cast</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="text" placeholder="Name" value={castName} onChange={e => setCastName(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Role" value={castRole} onChange={e => setCastRole(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Photo URL" value={castPhotoUrl} onChange={e => setCastPhotoUrl(e.target.value)} className={inputClass} />
        </div>
        <button onClick={addCastMember} className="btn mt-2 mb-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Add Cast</button>
        {cast.length > 0 && (
          <ul className="list-disc pl-5 text-sm">
            {cast.map((c, i) => (
              <li key={i}>
                {c.name} as {c.role}
                {c.photoUrl && (
                  <img
                    src={c.photoUrl}
                    alt={`${c.name}`}
                    className="mt-1 w-16 h-16 object-cover rounded-full border border-gray-700"
                  />
                )}
                            </li>
            ))}
          </ul>
        )}
      </section>

      {/* Theaters */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🏢 Theaters</h3>
        <p className="text-sm text-gray-400 mb-2">Select existing theaters that will show this movie.</p>
        <select
          multiple
          onChange={handleTheaterChange}
          className={`${inputClass} h-40`}
        >
          {availableTheaters.length > 0 ? (
            availableTheaters.map(theater => (
              <option key={theater._id} value={theater._id}>
                {theater.name} ({theater.location})
              </option>
            ))
          ) : (
            <option disabled>No theaters available. Add them via the admin panel first.</option>
          )}
        </select>
        {selectedTheaterIds.length > 0 && (
          <p className="text-sm mt-2">
            Selected: {selectedTheaterIds.length} theater{selectedTheaterIds.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* Submit */}
      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-semibold text-lg transition"
        >
          🚀 Submit Movie
        </button>
      </div>
    </div>
  );
}

export default AddMovie;
