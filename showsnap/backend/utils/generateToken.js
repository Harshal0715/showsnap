import jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for a given user.
 * @param {Object} payload - Contains user ID and optional role
 * @param {string} payload.id - MongoDB user ID
 * @param {string} [payload.role='user'] - User role (e.g., 'admin', 'user')
 * @param {string} [payload.type='access'] - Token type (e.g., 'access', 'refresh')
 * @param {string} [expiresIn='7d'] - Token expiration
 * @returns {string} JWT token
 */
const generateToken = ({ id, role = 'user', type = 'access' }, expiresIn = '7d') => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('❌ JWT_SECRET is missing in environment variables');
    throw new Error('JWT secret not configured');
  }

  if (!id) {
    console.error('❌ Missing user ID in token payload');
    throw new Error('User ID is required to generate token');
  }

  const payload = {
    id,
    role: role.toLowerCase(),
    type
  };

  try {
    return jwt.sign(payload, secret, {
      expiresIn,
      issuer: 'showsnap.in', // optional: issuer for additional security
      audience: 'showsnap-users'
    });
  } catch (err) {
    console.error('❌ Error generating JWT:', err.message);
    throw new Error('Token generation failed');
  }
};

export default generateToken;
