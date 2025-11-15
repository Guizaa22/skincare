const mongoose = require('mongoose');

// Middleware to check database connection
exports.requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not available. Please try again later or contact support.',
      info: 'To enable database features, please install and start MongoDB, or use MongoDB Atlas cloud service.'
    });
  }
  next();
};

// Middleware to handle database errors gracefully
exports.handleDatabaseErrors = (req, res, next) => {
  // Add database error handler to request
  req.handleDBError = (error) => {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  };
  next();
};

// Check if database is connected
exports.isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = exports;
