// Load environment variables FIRST (before any other requires)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');
const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const serviceRoutes = require('./routes/services');
const indexRoutes = require('./routes/index');

// Import MongoDB database configuration
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB database
connectDB();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // Increased to 1000 for testing
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting in development for localhost
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});

app.use(limiter);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration (needed for Passport OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  name: process.env.SESSION_NAME || 'skinsense_session',
  resave: false,
  saveUninitialized: false,
  // Temporarily disabled MongoDB store
  // store: MongoStore.create({
  //   mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/skinsense'
  // }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Make user available to all views
app.use(async (req, res, next) => {
  res.locals.user = null;
  
  // Check for token in cookie
  const token = req.cookies.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('./models/User');
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        res.locals.user = user;
        req.user = user;
      }
    } catch (error) {
      // Token invalid, continue without user
    }
  }
  next();
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes - API routes first to avoid conflicts
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/', indexRoutes);

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handler
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }

  // Send error response
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    // API request
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } else {
    // Web request
    res.status(statusCode).render('pages/error', {
      title: 'Error',
      statusCode,
      message: error.message || 'Internal Server Error'
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SkinSense server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email service: ${process.env.EMAIL_HOST || 'Not configured'}`);
  console.log(`📱 SMS service: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
