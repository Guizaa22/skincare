const User = require('../models/User');
const Booking = require('../models/Booking');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const emailService = require('../utils/emailService');
const smsService = require('../utils/smsService');
const { formatSuccessResponse, formatErrorResponse, generatePagination, maskEmail, maskPhone } = require('../utils/helpers');

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(
        formatErrorResponse('Please upload an image file')
      );
    }

    const user = await User.findById(req.user.id);

    // Delete old avatar if exists
    if (user.avatar.public_id) {
      try {
        await deleteImage(user.avatar.public_id);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Upload new avatar
    const result = await uploadImage(req.file.path, 'skinsense/avatars');

    // Update user avatar
    user.avatar = {
      public_id: result.public_id,
      url: result.url
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json(formatSuccessResponse({
      avatar: user.avatar
    }, 'Avatar updated successfully'));

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json(formatErrorResponse('Failed to upload avatar', error.message));
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.avatar.public_id) {
      try {
        await deleteImage(user.avatar.public_id);
      } catch (error) {
        console.error('Error deleting avatar:', error);
      }
    }

    // Reset to default avatar
    user.avatar = {
      public_id: null,
      url: 'https://res.cloudinary.com/demo/image/upload/v1/avatar-placeholder.png'
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json(formatSuccessResponse({
      avatar: user.avatar
    }, 'Avatar deleted successfully'));

  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json(formatErrorResponse('Failed to delete avatar', error.message));
  }
};

// Get user dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's booking statistics
    const [upcomingBookings, completedBookings, totalBookings, recentBookings] = await Promise.all([
      Booking.countDocuments({
        user: userId,
        status: { $in: ['confirmed', 'pending'] },
        appointmentDate: { $gte: new Date() }
      }),
      Booking.countDocuments({
        user: userId,
        status: 'completed'
      }),
      Booking.countDocuments({ user: userId }),
      Booking.find({
        user: userId
      })
        .populate('service', 'name category price')
        .sort('-createdAt')
        .limit(5)
    ]);

    // Calculate total spent
    const completedBookingsData = await Booking.find({
      user: userId,
      status: 'completed'
    });
    
    const totalSpent = completedBookingsData.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Get next appointment
    const nextAppointment = await Booking.findOne({
      user: userId,
      status: { $in: ['confirmed', 'pending'] },
      appointmentDate: { $gte: new Date() }
    })
      .populate('service', 'name category duration')
      .sort('appointmentDate');

    res.status(200).json(formatSuccessResponse({
      statistics: {
        upcomingBookings,
        completedBookings,
        totalBookings,
        totalSpent: totalSpent.toFixed(2)
      },
      nextAppointment: nextAppointment ? {
        id: nextAppointment._id,
        service: nextAppointment.service,
        appointmentDate: nextAppointment.formattedDate,
        appointmentTime: nextAppointment.appointmentTime,
        status: nextAppointment.status
      } : null,
      recentBookings: recentBookings.map(booking => ({
        id: booking._id,
        service: booking.service,
        appointmentDate: booking.formattedDate,
        status: booking.status,
        totalAmount: booking.formattedAmount
      }))
    }));

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(formatErrorResponse('Failed to get dashboard data', error.message));
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true, runValidators: true }
    );

    res.status(200).json(formatSuccessResponse({
      preferences: user.preferences
    }, 'Preferences updated successfully'));

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json(formatErrorResponse('Failed to update preferences', error.message));
  }
};

// Contact form submission
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Send confirmation email to user
    try {
      await emailService.sendContactConfirmation({
        name,
        email,
        subject,
        message
      });
    } catch (error) {
      console.error('Failed to send contact confirmation:', error);
    }

    // Send notification to admin
    try {
      await emailService.sendContactNotification({
        name,
        email,
        phone,
        subject,
        message
      });
    } catch (error) {
      console.error('Failed to send contact notification:', error);
    }

    res.status(200).json(formatSuccessResponse(null, 'Thank you for your message. We will get back to you soon!'));

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json(formatErrorResponse('Failed to submit contact form', error.message));
  }
};

// Newsletter subscription
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Send confirmation email
    try {
      await emailService.sendNewsletterConfirmation(email, name);
    } catch (error) {
      console.error('Failed to send newsletter confirmation:', error);
    }

    res.status(200).json(formatSuccessResponse(null, 'Successfully subscribed to newsletter!'));

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json(formatErrorResponse('Failed to subscribe to newsletter', error.message));
  }
};

// Get user profile (public view)
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json(
        formatErrorResponse('User not found')
      );
    }

    // Return limited public information
    res.status(200).json(formatSuccessResponse({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        joinDate: user.createdAt
      }
    }));

  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json(formatErrorResponse('Failed to get profile', error.message));
  }
};

// ADMIN FUNCTIONS

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;
    const isActive = req.query.isActive;
    const sort = req.query.sort || '-createdAt';

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const pagination = generatePagination(page, limit, total);

    // Mask sensitive data
    const maskedUsers = users.map(user => ({
      ...user.toObject(),
      email: maskEmail(user.email),
      phone: maskPhone(user.phone)
    }));

    res.status(200).json(formatSuccessResponse({
      users: maskedUsers,
      pagination
    }));

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json(formatErrorResponse('Failed to get users', error.message));
  }
};

// Get single user (Admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json(
        formatErrorResponse('User not found')
      );
    }

    // Get user's booking statistics
    const [totalBookings, completedBookings, cancelledBookings, totalSpent] = await Promise.all([
      Booking.countDocuments({ user: user._id }),
      Booking.countDocuments({ user: user._id, status: 'completed' }),
      Booking.countDocuments({ user: user._id, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { user: user._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.status(200).json(formatSuccessResponse({
      user: {
        ...user.toObject(),
        statistics: {
          totalBookings,
          completedBookings,
          cancelledBookings,
          totalSpent: totalSpent[0]?.total || 0
        }
      }
    }));

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(formatErrorResponse('Failed to get user', error.message));
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'role',
      'isActive',
      'isEmailVerified',
      'isPhoneVerified',
      'dateOfBirth',
      'gender',
      'skinType',
      'address',
      'preferences'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json(
        formatErrorResponse('User not found')
      );
    }

    res.status(200).json(formatSuccessResponse({
      user
    }, 'User updated successfully'));

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json(formatErrorResponse('Failed to update user', error.message));
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json(
        formatErrorResponse('User not found')
      );
    }

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      user: user._id,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    });

    if (activeBookings > 0) {
      return res.status(400).json(
        formatErrorResponse('Cannot delete user with active bookings')
      );
    }

    // Deactivate instead of deleting
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(formatSuccessResponse(null, 'User deactivated successfully'));

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json(formatErrorResponse('Failed to delete user', error.message));
  }
};

// Send bulk email (Admin only)
exports.sendBulkEmail = async (req, res) => {
  try {
    const { userIds, subject, template, variables } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json(
        formatErrorResponse('User IDs array is required')
      );
    }

    // Get users
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
      'preferences.newsletter': true
    });

    if (users.length === 0) {
      return res.status(400).json(
        formatErrorResponse('No eligible users found')
      );
    }

    // Send emails
    const results = [];
    for (const user of users) {
      try {
        const result = await emailService.sendEmail({
          to: user.email,
          subject: subject,
          template: template,
          variables: {
            firstName: user.firstName,
            lastName: user.lastName,
            ...variables
          }
        });
        results.push({ userId: user._id, success: result.success });
      } catch (error) {
        results.push({ userId: user._id, success: false, error: error.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json(formatSuccessResponse({
      totalSent: successful,
      totalFailed: failed,
      results: results
    }, `Bulk email completed: ${successful} sent, ${failed} failed`));

  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json(formatErrorResponse('Failed to send bulk email', error.message));
  }
};

// Get user statistics (Admin only)
exports.getUserStatistics = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      verifiedUsers,
      usersByRole,
      usersByMonth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      User.countDocuments({ isEmailVerified: true, isPhoneVerified: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    res.status(200).json(formatSuccessResponse({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      verifiedUsers,
      usersByRole,
      usersByMonth
    }));

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json(formatErrorResponse('Failed to get user statistics', error.message));
  }
};

module.exports = exports;
