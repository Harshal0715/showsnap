import logger from '../utils/logger.js';

/**
 * Middleware to restrict access to admin-only routes
 * @param {Array<string>} allowedRoles - Optional array of allowed roles
 */
const adminOnly = (allowedRoles = ['admin', 'superadmin']) => {
  return (req, res, next) => {
    const user = req.user;

    // 🔐 Ensure user is authenticated
    if (!user || !user.role) {
      (logger?.warn || console.warn)(
        `🔒 Unauthorized access attempt from IP ${req.ip || 'unknown'}`
      );
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const role = user.role.toLowerCase();
    if (allowedRoles.includes(role)) {
      return next();
    }

    (logger?.warn || console.warn)(
      `🚫 Access denied for user ${user.email || 'unknown'} with role "${user.role}"`
    );
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  };
};

export default adminOnly;
