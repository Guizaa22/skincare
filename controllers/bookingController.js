const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const smsService = require('../utils/smsService');
const { uploadImage } = require('../config/cloudinary');
const { formatSuccessResponse, formatErrorResponse, generatePagination } = require('../utils/helpers');
const moment = require('moment');

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      service: serviceId,
      appointmentDate,
      appointmentTime,
      notes,
      skinAssessment
    } = req.body;

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json(
        formatErrorResponse('Service not found or not available')
      );
    }

    // Check if time slot is available
    const isAvailable = await Booking.isTimeSlotAvailable(
      new Date(appointmentDate),
      appointmentTime,
      service.totalDuration
    );

    if (!isAvailable) {
      return res.status(400).json(
        formatErrorResponse('Selected time slot is not available')
      );
    }

    // Check advance booking notice
    const appointmentDateTime = moment(`${appointmentDate} ${appointmentTime}`);
    const hoursUntilAppointment = appointmentDateTime.diff(moment(), 'hours');

    if (hoursUntilAppointment < service.bookingAdvanceNotice) {
      return res.status(400).json(
        formatErrorResponse(`This service requires at least ${service.bookingAdvanceNotice} hours advance notice`)
      );
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user.id,
      service: serviceId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      duration: service.totalDuration,
      totalAmount: service.price,
      clientInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },
      notes: {
        client: notes?.client || ''
      },
      skinAssessment: skinAssessment || {}
    });

    // Populate service details
    await booking.populate('service');

    // Send confirmation email
    try {
      await emailService.sendAppointmentConfirmation(booking);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    // Send confirmation SMS
    try {
      if (req.user.preferences?.smsNotifications) {
        await smsService.sendAppointmentConfirmation(booking);
      }
    } catch (error) {
      console.error('Failed to send confirmation SMS:', error);
    }

    res.status(201).json(formatSuccessResponse({
      booking: {
        id: booking._id,
        service: booking.service,
        appointmentDate: booking.formattedDate,
        appointmentTime: booking.appointmentTime,
        duration: booking.duration,
        status: booking.status,
        totalAmount: booking.formattedAmount,
        invoiceNumber: booking.invoiceNumber,
        createdAt: booking.createdAt
      }
    }, 'Booking created successfully'));

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json(formatErrorResponse('Failed to create booking', error.message));
  }
};

// Get user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const sort = req.query.sort || '-appointmentDate';

    const skip = (page - 1) * limit;

    // Build query
    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'name category duration price')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    const pagination = generatePagination(page, limit, total);

    res.status(200).json(formatSuccessResponse({
      bookings: bookings.map(booking => ({
        id: booking._id,
        service: booking.service,
        appointmentDate: booking.formattedDate,
        appointmentTime: booking.appointmentTime,
        duration: booking.duration,
        status: booking.status,
        totalAmount: booking.formattedAmount,
        invoiceNumber: booking.invoiceNumber,
        createdAt: booking.createdAt
      })),
      pagination
    }));

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json(formatErrorResponse('Failed to get bookings', error.message));
  }
};

// Get single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service')
      .populate('user', 'firstName lastName email phone')
      .populate('staffMember', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json(
        formatErrorResponse('Booking not found')
      );
    }

    // Check if user owns booking or is admin/staff
    if (booking.user._id.toString() !== req.user.id && 
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse('Access denied')
      );
    }

    res.status(200).json(formatSuccessResponse({
      booking: {
        id: booking._id,
        service: booking.service,
        user: booking.user,
        staffMember: booking.staffMember,
        appointmentDate: booking.formattedDate,
        appointmentTime: booking.appointmentTime,
        duration: booking.duration,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.formattedAmount,
        depositAmount: booking.depositAmount,
        invoiceNumber: booking.invoiceNumber,
        notes: booking.notes,
        skinAssessment: booking.skinAssessment,
        treatmentPlan: booking.treatmentPlan,
        beforePhotos: booking.beforePhotos,
        afterPhotos: booking.afterPhotos,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }
    }));

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json(formatErrorResponse('Failed to get booking', error.message));
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json(
        formatErrorResponse('Booking not found')
      );
    }

    // Check permissions
    if (booking.user.toString() !== req.user.id && 
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse('Access denied')
      );
    }

    // Don't allow updates to completed or cancelled bookings
    if (['completed', 'cancelled', 'no-show'].includes(booking.status)) {
      return res.status(400).json(
        formatErrorResponse('Cannot update completed or cancelled bookings')
      );
    }

    const allowedUpdates = ['notes', 'skinAssessment'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Staff/Admin can update more fields
    if (['admin', 'staff'].includes(req.user.role)) {
      const staffAllowedUpdates = ['status', 'staffMember', 'treatmentPlan', 'paymentStatus'];
      staffAllowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('service user');

    res.status(200).json(formatSuccessResponse({
      booking: updatedBooking
    }, 'Booking updated successfully'));

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json(formatErrorResponse('Failed to update booking', error.message));
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('service');

    if (!booking) {
      return res.status(404).json(
        formatErrorResponse('Booking not found')
      );
    }

    // Check permissions
    if (booking.user.toString() !== req.user.id && 
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse('Access denied')
      );
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled', 'no-show'].includes(booking.status)) {
      return res.status(400).json(
        formatErrorResponse('Booking is already completed or cancelled')
      );
    }

    // Calculate refund based on cancellation policy
    const appointmentDateTime = moment(`${booking.appointmentDate.toISOString().split('T')[0]} ${booking.appointmentTime}`);
    const hoursUntilAppointment = appointmentDateTime.diff(moment(), 'hours');
    
    let refundAmount = 0;
    if (hoursUntilAppointment >= 24) {
      refundAmount = booking.totalAmount; // Full refund
    } else if (hoursUntilAppointment >= 4) {
      refundAmount = booking.totalAmount * 0.5; // 50% refund
    }
    // No refund for less than 4 hours notice

    // Cancel booking
    await booking.cancel(reason, req.user.id, refundAmount);

    // Send cancellation notifications
    try {
      await emailService.sendAppointmentCancellation(booking);
      if (booking.user.preferences?.smsNotifications) {
        await smsService.sendAppointmentCancellation(booking);
      }
    } catch (error) {
      console.error('Failed to send cancellation notifications:', error);
    }

    res.status(200).json(formatSuccessResponse({
      booking: {
        id: booking._id,
        status: booking.status,
        refundAmount: refundAmount
      }
    }, 'Booking cancelled successfully'));

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json(formatErrorResponse('Failed to cancel booking', error.message));
  }
};

// Reschedule booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('service');

    if (!booking) {
      return res.status(404).json(
        formatErrorResponse('Booking not found')
      );
    }

    // Check permissions
    if (booking.user.toString() !== req.user.id && 
        !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse('Access denied')
      );
    }

    // Check if booking can be rescheduled
    if (['completed', 'cancelled', 'no-show'].includes(booking.status)) {
      return res.status(400).json(
        formatErrorResponse('Cannot reschedule completed or cancelled bookings')
      );
    }

    // Check if new time slot is available
    const isAvailable = await Booking.isTimeSlotAvailable(
      new Date(newDate),
      newTime,
      booking.service.totalDuration,
      booking._id
    );

    if (!isAvailable) {
      return res.status(400).json(
        formatErrorResponse('Selected time slot is not available')
      );
    }

    // Reschedule booking
    await booking.reschedule(new Date(newDate), newTime, reason, req.user.id);

    // Send rescheduling notifications
    try {
      await emailService.sendAppointmentRescheduled(booking);
      if (booking.user.preferences?.smsNotifications) {
        await smsService.sendAppointmentRescheduled(booking);
      }
    } catch (error) {
      console.error('Failed to send rescheduling notifications:', error);
    }

    res.status(200).json(formatSuccessResponse({
      booking: {
        id: booking._id,
        appointmentDate: booking.formattedDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status
      }
    }, 'Booking rescheduled successfully'));

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json(formatErrorResponse('Failed to reschedule booking', error.message));
  }
};

// Upload booking photos
exports.uploadBookingPhotos = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json(
        formatErrorResponse('Booking not found')
      );
    }

    // Only staff/admin can upload photos
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse('Access denied')
      );
    }

    const uploadedPhotos = {
      beforePhotos: [],
      afterPhotos: []
    };

    // Upload before photos
    if (req.files?.beforePhotos) {
      for (const file of req.files.beforePhotos) {
        try {
          const result = await uploadImage(file.path, 'skinsense/booking-photos/before');
          uploadedPhotos.beforePhotos.push({
            public_id: result.public_id,
            url: result.url,
            description: req.body.beforeDescription || '',
            takenAt: new Date()
          });
        } catch (error) {
          console.error('Error uploading before photo:', error);
        }
      }
    }

    // Upload after photos
    if (req.files?.afterPhotos) {
      for (const file of req.files.afterPhotos) {
        try {
          const result = await uploadImage(file.path, 'skinsense/booking-photos/after');
          uploadedPhotos.afterPhotos.push({
            public_id: result.public_id,
            url: result.url,
            description: req.body.afterDescription || '',
            takenAt: new Date()
          });
        } catch (error) {
          console.error('Error uploading after photo:', error);
        }
      }
    }

    // Update booking with photos
    if (uploadedPhotos.beforePhotos.length > 0) {
      booking.beforePhotos.push(...uploadedPhotos.beforePhotos);
    }
    if (uploadedPhotos.afterPhotos.length > 0) {
      booking.afterPhotos.push(...uploadedPhotos.afterPhotos);
    }

    await booking.save();

    res.status(200).json(formatSuccessResponse({
      beforePhotos: booking.beforePhotos,
      afterPhotos: booking.afterPhotos
    }, 'Photos uploaded successfully'));

  } catch (error) {
    console.error('Upload booking photos error:', error);
    res.status(500).json(formatErrorResponse('Failed to upload photos', error.message));
  }
};

// Get available time slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json(
        formatErrorResponse('Date and service ID are required')
      );
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json(
        formatErrorResponse('Service not found')
      );
    }

    const requestedDate = new Date(date);
    
    // Check if date is in the past
    if (requestedDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json(
        formatErrorResponse('Cannot book appointments in the past')
      );
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      appointmentDate: requestedDate,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    // Generate all possible time slots
    const allSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }
    }

    // Filter available slots
    const availableSlots = allSlots.filter(slot => {
      return Booking.isTimeSlotAvailable(requestedDate, slot, service.totalDuration);
    });

    res.status(200).json(formatSuccessResponse({
      date: requestedDate.toISOString().split('T')[0],
      availableSlots: availableSlots,
      serviceDuration: service.totalDuration
    }));

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json(formatErrorResponse('Failed to get available slots', error.message));
  }
};

// Admin: Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const date = req.query.date;
    const sort = req.query.sort || '-createdAt';

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('service', 'name category duration price')
        .populate('user', 'firstName lastName email phone')
        .populate('staffMember', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    const pagination = generatePagination(page, limit, total);

    res.status(200).json(formatSuccessResponse({
      bookings,
      pagination
    }));

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json(formatErrorResponse('Failed to get bookings', error.message));
  }
};

// Admin: Get today's bookings
exports.getTodayBookings = async (req, res) => {
  try {
    const bookings = await Booking.getTodayBookings();

    res.status(200).json(formatSuccessResponse({
      bookings: bookings.map(booking => ({
        id: booking._id,
        service: booking.service,
        user: booking.user,
        appointmentTime: booking.appointmentTime,
        duration: booking.duration,
        status: booking.status,
        clientInfo: booking.clientInfo
      })),
      count: bookings.length
    }));

  } catch (error) {
    console.error('Get today bookings error:', error);
    res.status(500).json(formatErrorResponse('Failed to get today\'s bookings', error.message));
  }
};

module.exports = exports;
