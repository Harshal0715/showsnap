// backend/config/db.js
import mongoose from 'mongoose';
import { config } from './config.js';
import logger from '../utils/logger.js';

const log = logger || console;

const connectDB = async () => {
  try {
    mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(config.mongoURI, {
      serverSelectionTimeoutMS: 5000
    });

    log.info(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      log.warn('🛑 MongoDB disconnected on app termination');
      process.exit(0);
    });

  } catch (error) {
    log.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
