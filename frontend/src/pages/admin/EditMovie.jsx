import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMovieById, updateMovie } from '../../services/api';
import toast from 'react-hot-toast';

function EditMovie() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieById(movieId)
      .then(res => {
        setMovie(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch movie:', err);
        toast.error('Movie not found');
        navigate('/admin');
      });
  }, [movieId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMovie(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMovie(movieId, movie);
      toast.success('Movie updated successfully');
      navigate('/admin');
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update movie');
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading movie...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Edit Movie</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          name="title"
          value={movie.title || ''}
          onChange={handleChange}
          placeholder="Title"
          className="p-3 border rounded bg-white text-black"
        />
        <input
          type="text"
          name="genre"
          value={movie.genre || ''}
          onChange={handleChange}
          placeholder="Genre"
          className="p-3 border rounded bg-white text-black"
        />
        <input
          type="number"
          name="rating"
          value={movie.rating || ''}
          onChange={handleChange}
          placeholder="Rating"
          className="p-3 border rounded bg-white text-black"
          step="0.1"
          min="0"
          max="10"
        />
        <input
          type="text"
          name="language"
          value={movie.language || ''}
          onChange={handleChange}
          placeholder="Language"
          className="p-3 border rounded bg-white text-black"
        />
        <input
          type="text"
          name="releaseDate"
          value={movie.releaseDate || ''}
          onChange={handleChange}
          placeholder="Release Date (DD/MM/YYYY)"
          className="p-3 border rounded bg-white text-black"
        />
        <textarea
          name="description"
          value={movie.description || ''}
          onChange={handleChange}
          placeholder="Description"
          className="p-3 border rounded bg-white text-black"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditMovie;
