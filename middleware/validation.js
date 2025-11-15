const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Service = require('../models/Service');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// User registration validation
exports.validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already registered');
      }
      return true;
    }),

  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .custom(async (phone) => {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        throw new Error('Phone number already registered');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }
      if (age > 120) {
        throw new Error('Please provide a valid date of birth');
      }
      return true;
    }),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender selection'),

  body('skinType')
    .optional()
    .isIn(['oily', 'dry', 'combination', 'sensitive', 'normal'])
    .withMessage('Invalid skin type selection'),

  body('terms')
    .equals('true')
    .withMessage('You must accept the terms and conditions')
];

// User login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Update profile validation
exports.validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
    .custom(async (phone, { req }) => {
      if (phone && req.user.phone !== phone) {
        const existingUser = await User.findOne({ phone, _id: { $ne: req.user._id } });
        if (existingUser) {
          throw new Error('Phone number already registered');
        }
      }
      return true;
    }),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender selection'),

  body('skinType')
    .optional()
    .isIn(['oily', 'dry', 'combination', 'sensitive', 'normal'])
    .withMessage('Invalid skin type selection'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address cannot exceed 100 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),

  body('address.zipCode')
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid ZIP code')
];

// Change password validation
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Booking validation
exports.validateBooking = [
  body('service')
    .isMongoId()
    .withMessage('Invalid service ID')
    .custom(async (serviceId) => {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        throw new Error('Service not found or not available');
      }
      return true;
    }),

  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);

      if (appointmentDate <= now) {
        throw new Error('Appointment date must be in the future');
      }

      if (appointmentDate > maxDate) {
        throw new Error('Cannot book appointments more than 6 months in advance');
      }

      // Check if it's not a Sunday (assuming business is closed on Sundays)
      if (appointmentDate.getDay() === 0) {
        throw new Error('We are closed on Sundays');
      }

      return true;
    }),

  body('appointmentTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide valid time in HH:MM format')
    .custom((value) => {
      const [hours, minutes] = value.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      // Business hours: 9 AM to 6 PM
      const openTime = 9 * 60; // 9:00 AM
      const closeTime = 18 * 60; // 6:00 PM

      if (timeInMinutes < openTime || timeInMinutes >= closeTime) {
        throw new Error('Appointment time must be between 9:00 AM and 6:00 PM');
      }

      return true;
    }),

  body('notes.client')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('skinAssessment.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('skinAssessment.medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array')
];

// Service creation/update validation (Admin only)
exports.validateService = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Service name must be between 3 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('shortDescription')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Short description must be between 10 and 200 characters'),

  body('category')
    .isIn([
      'facial-treatments',
      'body-treatments',
      'anti-aging',
      'acne-treatments',
      'skin-analysis',
      'chemical-peels',
      'microdermabrasion',
      'laser-treatments',
      'consultation',
      'packages'
    ])
    .withMessage('Invalid service category'),

  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('skinTypes')
    .optional()
    .isArray()
    .withMessage('Skin types must be an array'),

  body('targetConcerns')
    .optional()
    .isArray()
    .withMessage('Target concerns must be an array')
];

// Email verification validation
exports.validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid verification token')
];

// Phone verification validation
exports.validatePhoneVerification = [
  body('code')
    .isNumeric()
    .withMessage('Verification code must be numeric')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
];

// Reset password validation
exports.validateResetPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Confirm reset password validation
exports.validateConfirmResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Contact form validation
exports.validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('subject')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),

  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// ID parameter validation
exports.validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['name', 'price', 'duration', 'rating', 'createdAt', '-name', '-price', '-duration', '-rating', '-createdAt'])
    .withMessage('Invalid sort parameter')
];

module.exports = exports;
