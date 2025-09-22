import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Theater from './models/Theater.js';
import Movie from './models/Movie.js';

dotenv.config();

const updateTheatersWithMovies = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Step 1: Fetch the IDs of all movies
        const movies = await Movie.find({}, '_id').lean();
        if (movies.length === 0) {
            console.log('⚠️ No movies found in the database. Please add movies first.');
            return;
        }
        const movieIds = movies.map(movie => movie._id);

        // Step 2: Create structured showtime objects for each movie
        const showtimesForMovies = movieIds.flatMap(movieId => [
            { movie: movieId, startTime: new Date('2025-09-23T10:00:00.000Z'), screen: 'Screen 1', availableSeats: 100 },
            { movie: movieId, startTime: new Date('2025-09-23T14:00:00.000Z'), screen: 'Screen 2', availableSeats: 120 }
        ]);

        // Step 3: Update all theater documents with the new movies and showtimes
        const result = await Theater.updateMany(
            {}, // Filter: an empty object {} selects all documents
            {
                // Adds all movie IDs to the 'movies' array, avoiding duplicates
                $addToSet: { movies: { $each: movieIds } },
                // Adds all showtime objects to the 'showtimes' array
                $push: { showtimes: { $each: showtimesForMovies } }
            }
        );

        console.log(`✅ Successfully updated ${result.modifiedCount} theaters.`);
        console.log(`Added ${movieIds.length} movies and ${showtimesForMovies.length} showtimes.`);

    } catch (error) {
        console.error('❌ Error updating theaters:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🛑 MongoDB connection closed.');
    }
};

updateTheatersWithMovies();