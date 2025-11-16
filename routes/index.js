const express = require('express');
const {
  uploadAvatar,
  deleteAvatar,
  getDashboard,
  updatePreferences,
  submitContactForm,
  subscribeNewsletter,
  getPublicProfile,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  sendBulkEmail,
  getUserStatistics
} = require('../controllers/userController');

const {
  validateContact,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

const {
  protect,
  authorize,
  optionalAuth,
  actionRateLimit,
  generateCSRFToken
} = require('../middleware/auth');

const { requireDatabase, isDatabaseConnected } = require('../middleware/database');

const {
  uploadAvatar: uploadAvatarMiddleware,
  handleUploadErrors,
  cleanupTempFiles
} = require('../middleware/upload');

const Service = require('../models/Service');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');

const router = express.Router();

// Add CSRF token only for non-API routes
router.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return generateCSRFToken(req, res, next);
  }
  next();
});

// Public routes
router.get('/', async (req, res) => {
  try {
    // If user is logged in, redirect to their appropriate dashboard
    if (req.user) {
      if (req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else if (req.user.role === 'client') {
        return res.redirect('/dashboard');
      }
    }

    // Public home page for non-logged-in users
    let featuredServices = [];
    let popularServices = [];

    if (isDatabaseConnected()) {
      // Get featured services from database
      featuredServices = await Service.getFeatured(3);
      popularServices = await Service.getPopular(6);
    } else {
      // Use static sample data
      const sampleServices = require('../sample-data');
      featuredServices = sampleServices.filter(s => s.isFeatured).slice(0, 3);
      popularServices = sampleServices.filter(s => s.isPopular).slice(0, 6);
    }

    res.render('pages/home', {
      title: 'SkinSense - Professional Skin Care Services',
      featuredServices,
      popularServices,
      user: req.user || null
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load homepage'
    });
  }
});

router.get('/services', optionalAuth, async (req, res) => {
  try {
    const category = req.query.category;
    let services = [];
    let categories = [];

    if (isDatabaseConnected()) {
      // Use database
      const query = { isActive: true };
      if (category) {
        query.category = category;
      }
      services = await Service.find(query).sort('displayOrder name');
      categories = await Service.distinct('category', { isActive: true });
    } else {
      // Use static sample data
      const sampleServices = require('../sample-data');
      services = sampleServices.filter(service => !category || service.category === category);
      categories = [...new Set(sampleServices.map(s => s.category))];
    }

    res.render('pages/services', {
      title: 'Our Services - SkinSense',
      services,
      categories,
      selectedCategory: category,
      user: req.user || null
    });
  } catch (error) {
    console.error('Services page error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load services'
    });
  }
});

router.get('/services/:id', optionalAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service || !service.isActive) {
      return res.status(404).render('pages/error', {
        title: 'Service Not Found',
        statusCode: 404,
        message: 'The requested service was not found'
      });
    }

    // Get related services
    const relatedServices = await Service.find({
      category: service.category,
      _id: { $ne: service._id },
      isActive: true
    }).limit(3);

    res.render('pages/service-detail', {
      title: `${service.name} - SkinSense`,
      service,
      relatedServices,
      user: req.user || null
    });
  } catch (error) {
    console.error('Service detail error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load service details'
    });
  }
});

router.get('/booking', protect, requireDatabase, async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort('category displayOrder');
    
    res.render('pages/booking', {
      title: 'Book Appointment - SkinSense',
      services,
      user: req.user
    });
  } catch (error) {
    console.error('Booking page error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load booking page'
    });
  }
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us - SkinSense',
    user: req.user || null
  });
});

router.post('/contact',
  actionRateLimit('contact', 60 * 60 * 1000, 3), // 3 submissions per hour
  validateContact,
  handleValidationErrors,
  submitContactForm
);

router.post('/newsletter',
  actionRateLimit('newsletter', 60 * 60 * 1000, 3), // 3 subscriptions per hour
  subscribeNewsletter
);

router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About Us - SkinSense',
    user: req.user || null
  });
});

router.get('/privacy', (req, res) => {
  res.render('pages/privacy', {
    title: 'Privacy Policy - SkinSense',
    user: req.user || null
  });
});

router.get('/terms', (req, res) => {
  res.render('pages/terms', {
    title: 'Terms of Service - SkinSense',
    user: req.user || null
  });
});

// Authentication pages
router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/login', {
    title: 'Login - SkinSense'
  });
});

router.get('/register', (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/register', {
    title: 'Register - SkinSense'
  });
});

// Dashboard routes
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get user's recent bookings and recommended services
    let bookings = [];
    let recommendedServices = [];
    let upcomingBookings = [];
    let completedBookings = [];
    
    if (isDatabaseConnected()) {
      const Booking = require('../models/Booking');
      
      // Get user's bookings
      bookings = await Booking.find({ user: req.user.id })
        .populate('service', 'name price duration')
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Separate upcoming and completed bookings
      const now = new Date();
      upcomingBookings = bookings.filter(booking => 
        new Date(booking.appointmentDate) > now && 
        ['pending', 'confirmed'].includes(booking.status)
      );
      
      completedBookings = bookings.filter(booking => 
        booking.status === 'completed'
      );
      
      // Get recommended services (featured services)
      recommendedServices = await Service.find({ 
        isActive: true, 
        isFeatured: true 
      }).limit(3);
    }
    
    res.render('pages/dashboard', {
      title: 'My Dashboard - SkinSense',
      user: req.user,
      bookings,
      upcomingBookings,
      completedBookings,
      recommendedServices
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load dashboard'
    });
  }
});

// Admin dashboard
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    let stats = {
      totalUsers: 0,
      totalBookings: 0,
      todayBookings: 0,
      revenue: 0
    };
    let recentBookings = [];
    
    if (isDatabaseConnected()) {
      // Add admin stats queries here
      // stats.totalUsers = await User.countDocuments();
      // stats.totalBookings = await Booking.countDocuments();
      // recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5);
    }
    
    res.render('pages/admin', {
      title: 'Admin Dashboard - SkinSense',
      user: req.user,
      ...stats,
      recentBookings,
      emailService: false, // Update when email is configured
      smsService: false    // Update when SMS is configured
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load admin dashboard'
    });
  }
});

router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    title: 'Forgot Password - SkinSense'
  });
});

router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect('/forgot-password');
  }
  
  res.render('pages/reset-password', {
    title: 'Reset Password - SkinSense',
    token
  });
});

router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  
  res.render('pages/verify-email', {
    title: 'Verify Email - SkinSense',
    token
  });
});

// Protected routes
router.use(protect);


router.get('/profile', (req, res) => {
  res.render('pages/profile', {
    title: 'My Profile - SkinSense',
    user: req.user
  });
});

router.get('/bookings', (req, res) => {
  res.render('pages/my-bookings', {
    title: 'My Bookings - SkinSense',
    user: req.user
  });
});

router.get('/bookings/:id', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.id)
      .populate('service')
      .populate('user');

    if (!booking) {
      return res.status(404).render('pages/error', {
        title: 'Booking Not Found',
        statusCode: 404,
        message: 'The requested booking was not found'
      });
    }

    // Check if user owns booking or is admin/staff
    if (booking.user._id.toString() !== req.user.id && 
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).render('pages/error', {
        title: 'Access Denied',
        statusCode: 403,
        message: 'You do not have permission to view this booking'
      });
    }

    res.render('pages/booking-detail', {
      title: 'Booking Details - SkinSense',
      booking,
      user: req.user
    });
  } catch (error) {
    console.error('Booking detail error:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load booking details'
    });
  }
});

// User profile routes
router.post('/avatar',
  uploadAvatarMiddleware,
  handleUploadErrors,
  cleanupTempFiles,
  uploadAvatar
);

router.delete('/avatar', deleteAvatar);

router.put('/preferences', updatePreferences);

router.get('/users/:id/profile',
  validateObjectId('id'),
  handleValidationErrors,
  getPublicProfile
);

// Admin routes
router.use(authorize('admin'));

router.get('/admin', (req, res) => {
  res.render('pages/admin/dashboard', {
    title: 'Admin Dashboard - SkinSense',
    user: req.user
  });
});

router.get('/admin/users',
  validatePagination,
  handleValidationErrors,
  (req, res) => {
    res.render('pages/admin/users', {
      title: 'Manage Users - SkinSense',
      user: req.user
    });
  }
);

router.get('/admin/bookings', (req, res) => {
  res.render('pages/admin/bookings', {
    title: 'Manage Bookings - SkinSense',
    user: req.user
  });
});

router.get('/admin/services', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/services', {
    title: 'Manage Services - SkinSense',
    user: req.user
  });
});

// Service form routes
router.get('/admin/services/new', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/service-form', {
    title: 'Add New Service - SkinSense',
    user: req.user,
    service: null
  });
});

router.get('/admin/services/:id/edit', protect, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.render('pages/error', {
        title: 'Error',
        statusCode: 404,
        message: 'Service not found'
      });
    }
    res.render('pages/admin/service-form', {
      title: 'Edit Service - SkinSense',
      user: req.user,
      service: service
    });
  } catch (error) {
    console.error('Error loading service:', error);
    res.render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to load service'
    });
  }
});

router.get('/admin/dashboard', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/dashboard', {
    title: 'Admin Dashboard - SkinSense',
    user: req.user
  });
});

router.get('/admin/bookings', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/bookings', {
    title: 'Manage Bookings - SkinSense',
    user: req.user
  });
});

router.get('/admin/users', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/users', {
    title: 'Manage Users - SkinSense',
    user: req.user
  });
});

router.get('/admin/settings', protect, authorize('admin'), (req, res) => {
  res.render('pages/admin/settings', {
    title: 'Admin Settings - SkinSense',
    user: req.user
  });
});

router.get('/admin/reports', (req, res) => {
  res.render('pages/admin/reports', {
    title: 'Reports - SkinSense',
    user: req.user
  });
});

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

// API routes for admin
router.get('/api/admin/users',
  validatePagination,
  handleValidationErrors,
  getAllUsers
);

router.get('/api/admin/users/statistics', getUserStatistics);

router.get('/api/admin/users/:id',
  validateObjectId('id'),
  handleValidationErrors,
  getUser
);

router.put('/api/admin/users/:id',
  validateObjectId('id'),
  handleValidationErrors,
  updateUser
);

router.delete('/api/admin/users/:id',
  validateObjectId('id'),
  handleValidationErrors,
  deleteUser
);

router.post('/api/admin/users/bulk-email',
  actionRateLimit('bulk-email', 60 * 60 * 1000, 1), // 1 bulk email per hour
  sendBulkEmail
);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json(formatSuccessResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  }));
});

// API status
router.get('/api/status', (req, res) => {
  res.status(200).json(formatSuccessResponse({
    api: 'SkinSense API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  }));
});

module.exports = router;
