// @ts-nocheck
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Authentication middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in different places
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Authorization header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Cookie
      token = req.cookies.token;
    } else if (req.session.token) {
      // Session
      token = req.session.token;
    }

    // Determine if this is a web page request or API request
    const isApiRequest = req.path.startsWith('/api') || 
                         req.xhr || 
                         req.headers.accept?.includes('application/json');

    if (!token) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }
      // Redirect to login page for web requests
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token (exclude password field)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        if (isApiRequest) {
          return res.status(401).json({
            success: false,
            message: 'Token is not valid. User not found.'
          });
        }
        // Clear invalid token and redirect
        res.clearCookie('token');
        return res.redirect('/login?error=session_expired');
      }

      if (!user.isActive) {
        if (isApiRequest) {
          return res.status(401).json({
            success: false,
            message: 'User account is deactivated.'
          });
        }
        res.clearCookie('token');
        return res.redirect('/login?error=account_deactivated');
      }

      // Update last login (only update every 5 minutes to reduce DB load)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (!user.lastLogin || user.lastLogin < fiveMinutesAgo) {
        user.lastLogin = new Date();
        await user.save();
      }

      req.user = user;
      next();
    } catch (error) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid.'
        });
      }
      // Clear invalid token and redirect
      res.clearCookie('token');
      return res.redirect('/login?error=invalid_token');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    const isApiRequest = req.path.startsWith('/api') || req.xhr;
    if (isApiRequest) {
      res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    } else {
      res.redirect('/login?error=server_error');
    }
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.session.token) {
      token = req.session.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log('Invalid token in optional auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Check if user owns resource or is admin
exports.ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user owns the resource
  const resourceUserId = req.params.userId || req.body.userId || req.user._id;
  
  if (req.user._id.toString() !== resourceUserId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

// Verify email middleware
exports.requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email address.'
    });
  }

  next();
};

// Verify phone middleware
exports.requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  if (!req.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required. Please verify your phone number.'
    });
  }

  next();
};

// Check if user can make bookings
exports.canMakeBooking = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login first.'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to make bookings.'
    });
  }

  if (!req.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required to make bookings.'
    });
  }

  next();
};

// Rate limiting for specific actions
exports.actionRateLimit = (action, windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${action}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    for (const [attemptKey, timestamp] of attempts.entries()) {
      if (timestamp < windowStart) {
        attempts.delete(attemptKey);
      }
    }

    // Get current attempts for this key
    const userAttempts = Array.from(attempts.entries())
      .filter(([attemptKey]) => attemptKey === key)
      .length;

    if (userAttempts >= max) {
      return res.status(429).json({
        success: false,
        message: `Too many ${action} attempts. Please try again later.`
      });
    }

    attempts.set(`${key}-${now}`, now);
    next();
  };
};

// CSRF protection for state-changing operations
exports.csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// Generate CSRF token
exports.generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto')
      .randomBytes(32)
      .toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

module.exports = exports;
