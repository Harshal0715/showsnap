import React, { useEffect, useState } from 'react';
import { getAllUserBookings } from '../services/api';
import toast from 'react-hot-toast';

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllUserBookings()
      .then(res => {
        const userBookings = res?.data?.bookings || [];
        setBookings(userBookings);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bookings:', err.message);
        toast.error('Failed to load bookings');
        setError('Failed to load bookings. Please log in.');
        setLoading(false);
      });
  }, [setBookings, setLoading, setError]);

  if (loading) {
    return (
      <div className="p-6 text-center text-lg animate-pulse text-gray-600">
        Loading your bookings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        You haven’t booked any tickets yet. Start exploring movies now!
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-red-500">🎟️ My Bookings</h1>
      <div className="grid gap-6">
        {bookings.map(booking => {
          const movie = booking.movie || {};
          const poster = movie.posterUrl?.trim() || 'https://via.placeholder.com/100x150?text=No+Image';
          const title = movie.title || 'Untitled';
          const showtime = booking.showtimeDate ? new Date(booking.showtimeDate).toLocaleString() : 'N/A';
          const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : 'N/A';
          const theater = booking.theater || {};
          const status = booking.status || 'confirmed';

          return (
            <div
              key={booking._id}
              className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-300 ease-in-out"
            >
              <img
                src={poster}
                alt={`Poster of ${title}`}
                className="w-28 h-auto rounded object-cover"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-600">🎬 Showtime: {showtime}</p>
                <p className="text-sm text-gray-600">🎟️ Seats: {seats}</p>
                <p className="text-sm text-gray-600">
                  📍 Theater: {theater.name || 'Unknown'} ({theater.location || 'N/A'})
                </p>
                <span
                  className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                    status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BookingHistory;