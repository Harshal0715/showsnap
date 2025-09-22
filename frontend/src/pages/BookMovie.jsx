// pages/BookMovie.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import handleRazorpayPayment from '../components/RazorpayCheckout';
import axios from 'axios';

function BookMovie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheaterIndex, setSelectedTheaterIndex] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatCount, setSeatCount] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const rows = useMemo(() => ['A', 'B', 'C', 'D'], []);
  const cols = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const pricePerSeat = 250;
  const totalPrice = selectedSeats.length * pricePerSeat;
  const selectedTheater = theaters?.[Number(selectedTheaterIndex)];

  const seatMap = useMemo(() => {
    return rows.flatMap(row =>
      cols.map(col => ({
        id: `${row}${col}`,
        status: Math.random() < 0.2 ? 'booked' : 'available'
      }))
    );
  }, [rows, cols]);

  useEffect(() => {
    const fetchMovieAndTheaters = async () => {
      if (!id) {
        setError('Invalid movie ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // ✅ Make a single API call to fetch the movie by ID, which will now include theaters
        const movieRes = await axios.get(`http://localhost:5000/api/movies/${id}`);
        setMovie(movieRes.data);
        // ✅ Set the theaters state from the fetched movie data
        setTheaters(movieRes.data.theaters);
        
      } catch (err) {
        console.error('❌ Error fetching movie or theaters:', err.response?.data?.error || err.message);
        setError('Failed to load movie or theater data. The movie might not be playing in any theaters.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieAndTheaters();
  }, [id]);

  const toggleSeat = (seatId) => {
    const seat = seatMap.find(s => s.id === seatId);
    if (seat?.status === 'booked') return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < seatCount) {
        setSelectedSeats([...selectedSeats, seatId]);
      } else {
        alert(`You can only select ${seatCount} seat(s).`);
      }
    }
  };

  const handleBooking = async () => {
    setError('');
    setSuccess('');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
      navigate('/login');
      return null;
    }

    if (!movie || selectedTheaterIndex === '') {
      setError('Movie or theater not selected');
      return null;
    }

    if (!selectedShowtime || selectedSeats.length !== seatCount) {
      setError(`Please select a showtime and exactly ${seatCount} seat(s).`);
      return null;
    }
    
    const selectedTheater = theaters[parseInt(selectedTheaterIndex)];
    const selectedShowtimeObj = selectedTheater.showtimes.find(st => st.startTime === selectedShowtime);

    if (!selectedShowtimeObj) {
      setError('Invalid showtime selected.');
      return null;
    }
    
    return {
      movieId: id,
      seats: selectedSeats,
      theater: {
        name: selectedTheater?.name || '',
        location: selectedTheater?.location || '',
      },
      showtimeId: selectedShowtimeObj._id,
      showtimeDate: new Date(selectedShowtime).toISOString(),
      amount: totalPrice * 100,
    };
  };

  const initiatePayment = async () => {
    const payload = await handleBooking();
    if (!payload) return;

    try {
      await handleRazorpayPayment(payload, null, navigate);
      setSuccess('🎉 Booking successful!');
      setSelectedSeats([]);
      setSelectedShowtime('');
      setSelectedTheaterIndex('');
    } catch (err) {
      console.error('❌ Payment initiation failed:', err);
      setError(err?.message || 'Payment failed. Please try again.');
    }
  };

  const formatShowtime = (time) => {
    if (!time) return 'Not selected';
    const parsed = new Date(time);
    return isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toLocaleString('en-IN');
  };

  const user = JSON.parse(localStorage.getItem('user'));
  
  if (loading) {
    return (
      <div className="p-6 text-center text-lg animate-pulse text-gray-600">
        Loading movie details and theaters...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }
  
  if (!movie) {
    return <div className="p-6 text-center text-red-500">Movie not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white text-gray-900 rounded-lg shadow-lg">
      <h2 className="text-4xl font-bold mb-6 text-center text-red-600">{movie.title}</h2>
      <div className="flex justify-center mb-6">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-64 h-[360px] object-cover rounded-xl shadow-lg"
        />
      </div>
      {movie.trailerUrl && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-center">Watch Trailer</h3>
          <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
              src={`https://www.youtube.com/embed/${movie.trailerUrl.split('v=')[1]}`}
              title="YouTube trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      <div className="text-center mb-6">
        <p className="text-gray-700">{movie.description}</p>
        <p><strong>Genres:</strong> {movie.genre || 'N/A'}</p>
        <p><strong>Rating:</strong> {movie.rating || 'N/A'}/10</p>
      </div>
      {movie.cast && movie.cast.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 text-center">Cast & Crew</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-center">
            {movie.cast.map((actor, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded shadow-sm hover:shadow-md">
                <img
                  src={actor.photoUrl}
                  alt={actor.name}
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div>
                  <p className="font-semibold text-gray-800">{actor.name}</p>
                  <p className="text-sm text-gray-600">{actor.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block font-semibold mb-1">Select Theater</label>
          <select
            value={selectedTheaterIndex}
            onChange={(e) => {
              setSelectedTheaterIndex(e.target.value);
              setSelectedShowtime('');
              setSelectedSeats([]);
            }}
            className="border p-2 rounded w-full bg-white"
          >
            <option value="">-- Choose a theater --</option>
            {theaters.map((t, idx) => (
              <option key={t._id} value={idx}>
                {t.name} ({t.location})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Select Showtime</label>
          <select
            value={selectedShowtime}
            onChange={(e) => setSelectedShowtime(e.target.value)}
            className="border p-2 rounded w-full bg-white"
            disabled={!selectedTheater}
          >
            <option value="">-- Choose a showtime --</option>
            {selectedTheater?.showtimes?.map((st) => (
              <option key={st._id} value={st.startTime}>
                {formatShowtime(st.startTime)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Number of Seats</label>
          <select
            value={seatCount}
            onChange={(e) => {
              setSeatCount(Number(e.target.value));
              setSelectedSeats([]);
            }}
            className="border p-2 rounded w-full bg-white"
          >
            {[1, 2, 3, 4, 5].map(count => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-center mb-4 mt-6">
        <div className="w-2/3 text-center text-sm font-semibold text-white bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 rounded-t-full py-1 shadow-md">
          SCREEN
        </div>
      </div>
      <div className="space-y-3 mt-4 mb-6">
        {rows.map(row => (
          <div key={row} className="flex gap-2 justify-center">
            {cols.map(col => {
              const seatId = `${row}${col}`;
              const seat = seatMap.find(s => s.id === seatId);
              const isSelected = selectedSeats.includes(seatId);
              const isBooked = seat?.status === 'booked';
              return (
                <button
                  key={seatId}
                  disabled={isBooked}
                  onClick={() => toggleSeat(seatId)}
                  className={`px-3 py-2 rounded border font-semibold text-sm
                    ${isBooked ? 'bg-gray-500 text-white cursor-not-allowed' :
                      isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}
                    transition duration-200`}
                >
                  {seatId}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded shadow-sm text-center">
        <h3 className="text-lg font-semibold mb-2">Booking Summary</h3>
        <p><strong>Movie:</strong> {movie.title}</p>
        <p><strong>Theater:</strong> {selectedTheater?.name || 'Not selected'}</p>
        <p><strong>Showtime:</strong> {formatShowtime(selectedShowtime)}</p>
        <p><strong>Seats:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}</p>
        <p><strong>User:</strong> {user?.name} ({user?.email})</p>
        <p className="text-indigo-600 font-bold mt-2">Total Price: ₹{totalPrice}</p>
      </div>
      <button
        onClick={initiatePayment}
        disabled={selectedSeats.length !== seatCount || !selectedShowtime || !selectedTheater}
        className={`mt-6 px-6 py-3 rounded font-semibold text-lg w-full ${
          selectedSeats.length !== seatCount || !selectedShowtime || !selectedTheater
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        Pay ₹{totalPrice} & Book Now
      </button>
      {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      {success && <p className="text-green-600 mt-2 text-center">{success}</p>}
    </div>
  );
}

export default BookMovie;