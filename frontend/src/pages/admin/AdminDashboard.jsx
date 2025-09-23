import React, { useEffect, useState, useContext } from 'react';
import {
  fetchAdminMovies,
  getAllBookings,
  deleteMovie,
  getAdminStats,
  pingAdmin
} from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ users: 0, movies: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingMovieId, setDeletingMovieId] = useState(null);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadAdminData = async () => {
      if (!token || !user || !['admin', 'superadmin'].includes(user.role)) {
        toast.error('Unauthorized access. Please log in.');
        navigate('/login');
        return;
      }

      try {
        await pingAdmin({ headers: { Authorization: `Bearer ${token}` } });

        const [movieRes, bookingRes, statsRes] = await Promise.all([
          fetchAdminMovies({ headers: { Authorization: `Bearer ${token}` } }),
          getAllBookings({ headers: { Authorization: `Bearer ${token}` } }),
          getAdminStats({
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          })
        ]);

        const movieList = Array.isArray(movieRes?.data?.movies)
          ? movieRes.data.movies
          : Array.isArray(movieRes?.data)
          ? movieRes.data
          : [];

        const bookingList = Array.isArray(bookingRes?.data?.bookings)
          ? bookingRes.data.bookings
          : [];

        const statsData = statsRes?.data || { users: 0, movies: 0, bookings: 0 };

        setMovies(movieList);
        setBookings(bookingList);
        setStats(statsData);
      } catch (err) {
        console.error('Admin data fetch error:', err.response?.data || err.message);
        setError('Failed to load admin data. Please check your server or token.');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [navigate, user, token]);

  const handleDelete = async (movieId) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;

    setDeletingMovieId(movieId);
    try {
      await deleteMovie(movieId, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovies(prev => prev.filter(m => m._id !== movieId));
      toast.success('Movie deleted successfully');
    } catch (err) {
      console.error('Movie deletion error:', err.response?.data || err.message);
      toast.error('Failed to delete movie');
    } finally {
      setDeletingMovieId(null);
    }
  };

  if (loading) return <div className="p-6 text-center animate-pulse text-gray-500">Loading admin dashboard...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-indigo-700">Admin Dashboard</h1>

      {/* Stats */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-indigo-600 text-white p-4 rounded shadow hover:shadow-md transition">
            <h3 className="text-3xl font-bold">{stats.users}</h3>
            <p className="text-white text-sm">Users</p>
          </div>
          <div className="bg-emerald-600 text-white p-4 rounded shadow hover:shadow-md transition">
            <h3 className="text-3xl font-bold">{stats.movies}</h3>
            <p className="text-white text-sm">Movies</p>
          </div>
          <div className="bg-amber-600 text-white p-4 rounded shadow hover:shadow-md transition">
            <h3 className="text-3xl font-bold">{stats.bookings}</h3>
            <p className="text-white text-sm">Bookings</p>
          </div>
        </div>
      </section>

      {/* Movies */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Movies</h2>
          <Link to="/admin/add-movie">
            <button className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 transition">
              ➕ Add Movie
            </button>
          </Link>
        </div>

        {movies.length === 0 ? (
          <p className="text-gray-500 italic">No movies found.</p>
        ) : (
          <div className="grid gap-4">
            {movies.map(movie => (
              <div key={movie._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded shadow-sm bg-white hover:shadow-md transition">
                <div className="mb-2 md:mb-0">
                  <h3 className="text-lg font-semibold text-gray-800">{movie.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-600">
                    {movie.genre || 'Genre'} • {movie.rating || 'N/A'}/10 • {movie.language || 'Language'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Released: {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/edit-movie/${movie._id}`)}
                    className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(movie._id)}
                    disabled={deletingMovieId === movie._id}
                    className={`px-3 py-1 rounded transition ${
                      deletingMovieId === movie._id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {deletingMovieId === movie._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookings */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500 italic">No bookings found.</p>
        ) : (
          <div className="grid gap-4">
            {bookings.map(booking => (
              <div key={booking._id} className="p-4 border rounded shadow-sm bg-white hover:shadow-md transition">
                <h3 className="font-semibold text-gray-800">{booking.movie?.title || 'Unknown Movie'}</h3>
                <p className="text-sm text-gray-600">User: {booking.user?.email || 'N/A'}</p>
                <p className="text-sm text-gray-600">
                  Showtime: {booking.showtimeDate ? new Date(booking.showtimeDate).toLocaleString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Seats: {booking.seats?.join(', ') || 'N/A'}</p>
                <p className={`text-sm font-semibold ${booking.status === 'confirmed' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Status: {booking.status}
                </p>
                {booking.theater && (
                  <p className="text-sm text-gray-600">
                    Theater: {booking.theater.name} ({booking.theater.location})
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
