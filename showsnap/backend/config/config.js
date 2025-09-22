// backend/config/config.js
import dotenv from 'dotenv';
dotenv.config();

/**
 * List of required environment variables
 */
const requiredEnv = ['PORT', 'MONGO_URI', 'JWT_SECRET'];

/**
 * Verify that all required environment variables are present
 */
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1); // Stop the server if a critical env variable is missing
  }
});

/**
 * Configuration object exported for use across the app
 */
export const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  razorpayKey: process.env.RAZORPAY_KEY || '',
  razorpaySecret: process.env.RAZORPAY_SECRET || '',
  emailSender: process.env.EMAIL_SENDER || 'noreply@showsnap.in',
  clientURL: process.env.CLIENT_URL || 'http://localhost:3000'
};
