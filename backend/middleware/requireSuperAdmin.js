const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express middleware to strictly require SUPER_ADMIN privileges.
 * Verifies JWT token and checks that req.user.role === 'SUPER_ADMIN' (or 'ADMIN').
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Super Admin authentication token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authorization format.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_secret_key_here_must_be_long_and_secure'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin user account not found.'
      });
    }

    const role = User.normalizeRole(user.role);
    if (role !== User.ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Super Admin governance privileges required to access this resource.'
      });
    }

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in to Super Admin console again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.'
    });
  }
};

module.exports = requireSuperAdmin;
