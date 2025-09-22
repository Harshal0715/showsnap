import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Middleware to protect routes and attach authenticated user to request
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 🛡️ Extract token from Bearer header
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      (logger?.warn || console.warn)('🔒 Unauthorized access attempt: No token provided');
      return res.status(401).json({ error: 'Unauthorized. Token missing.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      (logger?.error || console.error)('❌ JWT_SECRET is missing in environment variables');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // 🔍 Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({
        error:
          jwtErr.name === 'TokenExpiredError'
            ? 'Token expired. Please log in again.'
            : 'Invalid token'
      });
    }

    // 👤 Fetch user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      (logger?.warn || console.warn)(`❌ Token valid but user not found: ${decoded.id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tokenType: decoded.type || 'access' // Optional: support for token types
    };

    next();
  } catch (err) {
    (logger?.error || console.error)(`❌ Auth middleware error: ${err.message}`);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
};

export default protect;
