import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublicMovies } from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [error, setError] = useState('');
  const [trailerModal, setTrailerModal] = useState({ open: false, url: '' });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [nowShowingRes, upcomingRes] = await Promise.all([
          fetchPublicMovies({ isUpcoming: false }), 
          fetchPublicMovies({ isUpcoming: true }),  
        ]);
        
        const nowShowingList = Array.isArray(nowShowingRes.data.movies) ? nowShowingRes.data.movies : [];
        const upcomingList = Array.isArray(upcomingRes.data.movies) ? upcomingRes.data.movies : [];
        
        setNowShowingMovies(nowShowingList);
        setUpcomingMovies(upcomingList); 
        setFeaturedIndex(0); 
        setLoading(false);
      } catch (err) {
        console.error('❌ Error loading data:', err.response?.data || err.message);
        setError('Failed to load movies or theaters.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const visibleMovies = useMemo(() => {
    return nowShowingMovies.filter((movie) => {
      return (
        movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedGenre
          ? movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
          : true) &&
        movie.rating >= minRating
      );
    });
  }, [nowShowingMovies, searchTerm, selectedGenre, minRating]);

  const genres = useMemo(
    () => [...new Set(nowShowingMovies.map((m) => m.genre).filter(Boolean))].sort(),
    [nowShowingMovies]
  );
  
  useEffect(() => {
    if (visibleMovies.length > 0) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % visibleMovies.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [visibleMovies]);

  const featuredMovie = visibleMovies[featuredIndex] || null;

  if (loading)
    return (
      <div className="p-6 text-center text-lg text-gray-600">
        Loading movies...
      </div>
    );
  if (error)
    return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 text-white">
      <header className="mb-6">
        <p className="text-gray-400">
          Welcome, <strong>{user?.name || 'Guest'}</strong>
        </p>
      </header>

      <section className="relative h-96 rounded-xl overflow-hidden shadow-lg mb-8">
        {featuredMovie?.posterUrl ? (
          <img
            src={featuredMovie.posterUrl}
            alt={featuredMovie.title}
            className="w-full h-full object-cover brightness-75 cursor-pointer"
            onClick={() => featuredMovie?._id && navigate(`/book/${featuredMovie._id}`)}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xl">
            No Featured Poster
          </div>
        )}
        <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-black/80 to-transparent w-full">
          <h2
            className="text-3xl font-bold cursor-pointer"
            onClick={() => featuredMovie?._id && navigate(`/book/${featuredMovie._id}`)}
          >
            {featuredMovie?.title || 'Untitled'}
          </h2>
          <p className="text-sm text-gray-400 mb-1">
            {featuredMovie?.genre && (
              <span className="bg-red-600 px-2 py-1 rounded text-white text-xs mr-2">
                {featuredMovie.genre}
              </span>
            )}
            {featuredMovie?.releaseDate && (
              <span>
                {new Date(featuredMovie.releaseDate).toLocaleDateString()}
              </span>
            )}
          </p>
          <p className="text-gray-300 mt-2 max-w-lg">
            {featuredMovie?.description || 'No description available.'}
          </p>
          <div className="mt-4 flex gap-3">
            {featuredMovie?.trailerUrl && (
              <button
                onClick={() =>
                  setTrailerModal({ open: true, url: featuredMovie.trailerUrl })
                }
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold"
              >
                Watch Trailer
              </button>
            )}
            {featuredMovie?._id && (
              <button
                onClick={() => navigate(`/book/${featuredMovie._id}`)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
        <button onClick={() => setFeaturedIndex((featuredIndex - 1 + visibleMovies.length) % visibleMovies.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70">
          ◀
        </button>
        <button onClick={() => setFeaturedIndex((featuredIndex + 1) % visibleMovies.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full hover:bg-black/70">
          ▶
        </button>
      </section>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-gray-900 text-white placeholder-gray-400"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="p-3 rounded-lg bg-gray-900 text-white w-full"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <div className="flex flex-col">
            <label className="text-sm text-gray-400 mb-1">
              Minimum Rating:{' '}
              <span className="text-yellow-400 font-semibold">{minRating}</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <button
            onClick={() => {
              setSelectedGenre('');
              setMinRating(0);
              setSearchTerm('');
            }}
            className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <section>
        <h3 className="text-2xl font-semibold mb-4">Now Showing</h3>
        {visibleMovies.length === 0 ? (
          <p className="text-center text-gray-400">No movies match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {visibleMovies.map((movie) => (
              <div
                key={movie._id}
                onClick={() => navigate(`/book/${movie._id}`)}
                className="cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 bg-white text-black"
              >
                <div className="relative">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-60 object-cover"
                    />
                  ) : (
                    <div className="w-full h-60 bg-gray-800 flex items-center justify-center text-white text-sm">
                      No Poster
                    </div>
                  )}
                  {movie.trailerUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrailerModal({ open: true, url: movie.trailerUrl });
                      }}
                      className="absolute top-2 right-2 bg-red-600 p-1 rounded text-white text-xs hover:bg-red-700"
                    >
                      ▶ Trailer
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-lg">{movie.title}</h4>
                  <p className="text-sm text-gray-600">
                    {movie.genre || 'Unknown Genre'}
                  </p>
                  <p className="text-sm text-yellow-500 font-semibold mt-1">
                    ⭐ {typeof movie.rating === 'number' ? movie.rating : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h3 className="text-2xl font-semibold mb-4">Coming Soon</h3>
        {upcomingMovies.length === 0 ? (
          <p className="text-center text-gray-400">No upcoming movies listed.</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {upcomingMovies.map((movie) => (
              <div
                key={movie._id}
                onClick={() => navigate(`/book/${movie._id}`)}
                className="min-w-[180px] cursor-pointer rounded-lg overflow-hidden shadow-md bg-white text-black hover:shadow-xl transition duration-300"
              >
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-60 object-cover"
                  />
                ) : (
                  <div className="w-full h-60 bg-gray-800 flex items-center justify-center text-white text-sm">
                    No Poster
                  </div>
                )}
                <div className="p-2">
                  <h4 className="font-semibold text-md">{movie.title}</h4>
                  {movie.releaseDate && (
                    <p className="text-xs text-gray-500">
                      {new Date(movie.releaseDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {trailerModal.open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setTrailerModal({ open: false, url: '' })}
        >
          <div
            className="w-full max-w-3xl aspect-video bg-black relative"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="w-full h-full"
              src={trailerModal.url.replace('watch?v=', 'embed/')}
              title="Trailer"
              frameBorder="0"
              allowFullScreen
            />
            <button
              onClick={() => setTrailerModal({ open: false, url: '' })}
              className="absolute top-2 right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>ShowSnap — Your gateway to cinematic experiences.</p>
        <p>Book smarter, watch better.</p>
        <div className="mt-2 flex justify-center gap-4 text-gray-400">
          <a href="https://play.google.com" target="_blank" rel="noopener noreferrer">Google Play</a>
          <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer">App Store</a>
        </div>
        <div className="mt-4">
          <p>Contact us: <a href="mailto:support@showsnap.in" className="text-blue-400">support@showsnap.in</a></p>
          <p className="mt-1">© 2025 ShowSnap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;