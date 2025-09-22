// backend/config/db.js
import mongoose from 'mongoose';
import { config } from './config.js';
import logger from '../utils/logger.js';

const log = logger || console; // Fallback to console if logger not available

const connectDB = async () => {
  const mongoURI = config.mongoURI;

  if (!mongoURI) {
    log.error('❌ MONGO_URI is missing in .env file');
    process.exit(1);
  }

  try {
    // 🔧 Indexing strategy based on environment
    mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });

    log.info(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Listen for index creation events
    mongoose.connection.on('index', (err) => {
      if (err) {
        log.error(`❌ Index creation failed: ${err.message}`);
      } else {
        log.info('✅ Indexes ensured successfully');
      }
    });

    // 🛑 Graceful shutdown
    const gracefulShutdown = async () => {
      await mongoose.connection.close();
      log.warn('🛑 MongoDB disconnected on app termination');
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    log.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
