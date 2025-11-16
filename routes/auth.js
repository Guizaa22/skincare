const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification,
  forgotPassword,
  resetPassword,
  deleteAccount,
  googleAuth,
  googleAuthFailure
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateEmailVerification,
  validatePhoneVerification,
  validateResetPassword,
  validateConfirmResetPassword,
  handleValidationErrors
} = require('../middleware/validation');

const {
  protect,
  actionRateLimit
} = require('../middleware/auth');

const passport = require('../config/passport');

const User = require('../models/User');

const router = express.Router();

// Public routes
router.post('/register', 
  actionRateLimit('register', 15 * 60 * 1000, 50), // Increased to 50 for testing
  validateRegister,
  handleValidationErrors,
  register
);

// Debug route
router.post('/test-login', async (req, res) => {
  try {
    console.log('🔍 TEST LOGIN CALLED');
    console.log('📝 Request body:', req.body);
    console.log('📋 Content-Type:', req.get('Content-Type'));
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    res.json({ success: true, message: 'Login successful', user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('❌ Test login error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/login',
  actionRateLimit('login', 15 * 60 * 1000, 50), // Increased to 50 for testing
  validateLogin,
  handleValidationErrors,
  login
);

router.get('/logout', logout);

// Google OAuth routes (only if configured)
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && 
                            process.env.GOOGLE_CLIENT_SECRET &&
                            process.env.GOOGLE_CLIENT_ID.trim() !== '' && 
                            process.env.GOOGLE_CLIENT_SECRET.trim() !== '' &&
                            process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

if (isGoogleConfigured) {
  router.get('/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  router.get('/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/api/auth/google/failure',
      session: false // We're using JWT, not sessions
    }),
    googleAuth
  );

  router.get('/google/failure', googleAuthFailure);
} else {
  // Fallback routes if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.redirect('/login?error=google_not_configured');
  });
  
  router.get('/google/callback', (req, res) => {
    res.redirect('/login?error=google_not_configured');
  });
  
  router.get('/google/failure', googleAuthFailure);
}

router.post('/forgot-password',
  actionRateLimit('forgot-password', 15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  validateResetPassword,
  handleValidationErrors,
  forgotPassword
);

router.post('/reset-password',
  actionRateLimit('reset-password', 15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  validateConfirmResetPassword,
  handleValidationErrors,
  resetPassword
);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', getMe);

router.put('/profile',
  validateUpdateProfile,
  handleValidationErrors,
  updateProfile
);

router.put('/change-password',
  actionRateLimit('change-password', 60 * 60 * 1000, 3), // 3 attempts per hour
  validateChangePassword,
  handleValidationErrors,
  changePassword
);

router.post('/verify-email',
  actionRateLimit('verify-email', 15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  validateEmailVerification,
  handleValidationErrors,
  verifyEmail
);

router.post('/verify-phone',
  actionRateLimit('verify-phone', 15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  validatePhoneVerification,
  handleValidationErrors,
  verifyPhone
);

router.post('/resend-email-verification',
  actionRateLimit('resend-email', 15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  resendEmailVerification
);

router.post('/resend-phone-verification',
  actionRateLimit('resend-phone', 15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  resendPhoneVerification
);

router.delete('/account',
  actionRateLimit('delete-account', 60 * 60 * 1000, 1), // 1 attempt per hour
  deleteAccount
);

module.exports = router;
