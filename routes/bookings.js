const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  rescheduleBooking,
  uploadBookingPhotos,
  getAvailableSlots,
  getAllBookings,
  getTodayBookings
} = require('../controllers/bookingController');

const {
  validateBooking,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

const {
  protect,
  authorize,
  canMakeBooking,
  actionRateLimit
} = require('../middleware/auth');

const {
  uploadBookingPhotos: uploadPhotos,
  handleUploadErrors,
  cleanupTempFiles
} = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public booking routes (for authenticated users)
router.get('/available-slots', getAvailableSlots);

router.get('/my-bookings',
  validatePagination,
  handleValidationErrors,
  getMyBookings
);

router.post('/',
  protect, // Only require login, not email/phone verification
  actionRateLimit('create-booking', 60 * 60 * 1000, 5), // 5 bookings per hour
  validateBooking,
  handleValidationErrors,
  createBooking
);

router.get('/:id',
  validateObjectId('id'),
  handleValidationErrors,
  getBooking
);

router.put('/:id',
  validateObjectId('id'),
  handleValidationErrors,
  updateBooking
);

router.post('/:id/cancel',
  validateObjectId('id'),
  handleValidationErrors,
  actionRateLimit('cancel-booking', 60 * 60 * 1000, 3), // 3 cancellations per hour
  cancelBooking
);

router.post('/:id/reschedule',
  validateObjectId('id'),
  handleValidationErrors,
  actionRateLimit('reschedule-booking', 60 * 60 * 1000, 3), // 3 reschedules per hour
  rescheduleBooking
);

// Staff/Admin only routes
router.post('/:id/photos',
  authorize('admin', 'staff'),
  validateObjectId('id'),
  handleValidationErrors,
  uploadPhotos,
  handleUploadErrors,
  cleanupTempFiles,
  uploadBookingPhotos
);

// Admin only routes
router.get('/',
  authorize('admin'),
  validatePagination,
  handleValidationErrors,
  getAllBookings
);

router.get('/admin/today',
  authorize('admin', 'staff'),
  getTodayBookings
);

module.exports = router;
