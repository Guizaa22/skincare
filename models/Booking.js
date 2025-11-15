const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Booking must include a service']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format']
  },
  duration: {
    type: Number,
    required: [true, 'Appointment duration is required'],
    min: [15, 'Minimum duration is 15 minutes']
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'in-progress',
      'completed',
      'cancelled',
      'no-show',
      'rescheduled'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded', 'failed'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  depositAmount: {
    type: Number,
    default: 0,
    min: [0, 'Deposit cannot be negative']
  },
  notes: {
    client: {
      type: String,
      maxlength: [500, 'Client notes cannot exceed 500 characters']
    },
    staff: {
      type: String,
      maxlength: [500, 'Staff notes cannot exceed 500 characters']
    },
    internal: {
      type: String,
      maxlength: [500, 'Internal notes cannot exceed 500 characters']
    }
  },
  staffMember: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  clientInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    emergencyContact: {
      name: String,
      phone: String
    }
  },
  skinAssessment: {
    skinType: {
      type: String,
      enum: ['oily', 'dry', 'combination', 'sensitive', 'normal']
    },
    concerns: [{
      type: String,
      enum: ['acne', 'aging', 'dryness', 'sensitivity', 'pigmentation', 'rosacea', 'other']
    }],
    allergies: [String],
    medications: [String],
    previousTreatments: [String],
    skinConditions: [String]
  },
  treatmentPlan: {
    recommendedFrequency: String,
    homecarePlan: [String],
    followUpDate: Date,
    productsRecommended: [{
      name: String,
      brand: String,
      price: Number,
      instructions: String
    }]
  },
  reminders: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    reminderTime: {
      type: Number,
      default: 24 // hours before appointment
    }
  },
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  rescheduling: {
    originalDate: Date,
    originalTime: String,
    reason: String,
    rescheduledAt: Date,
    rescheduledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  checkIn: {
    time: Date,
    notes: String
  },
  checkOut: {
    time: Date,
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'online', 'bank-transfer', 'insurance']
    },
    transactionId: String,
    receiptNumber: String,
    paymentDate: Date
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'walk-in', 'referral', 'social-media', 'admin'],
    default: 'website'
  },
  referralSource: String,
  isFirstTimeClient: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  consentForms: [{
    formType: {
      type: String,
      required: true
    },
    signedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    documentUrl: String
  }],
  beforePhotos: [{
    public_id: String,
    url: String,
    description: String,
    takenAt: {
      type: Date,
      default: Date.now
    }
  }],
  afterPhotos: [{
    public_id: String,
    url: String,
    description: String,
    takenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment datetime
bookingSchema.virtual('appointmentDateTime').get(function() {
  const dateStr = this.appointmentDate.toISOString().split('T')[0];
  return new Date(`${dateStr}T${this.appointmentTime}:00`);
});

// Virtual for formatted appointment date
bookingSchema.virtual('formattedDate').get(function() {
  return this.appointmentDate.toLocaleDateString();
});

// Virtual for formatted total amount
bookingSchema.virtual('formattedAmount').get(function() {
  return `$${this.totalAmount.toFixed(2)}`;
});

// Pre-save middleware to generate invoice number
bookingSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    this.invoiceNumber = `SS-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to set first-time client flag
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const previousBookings = await this.constructor.countDocuments({
      user: this.user,
      status: { $in: ['completed', 'confirmed'] }
    });
    this.isFirstTimeClient = previousBookings === 0;
  }
  next();
});

// Static method to get bookings by date range
bookingSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('user service');
};

// Static method to get today's bookings
bookingSchema.statics.getTodayBookings = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    appointmentDate: {
      $gte: today,
      $lt: tomorrow
    }
  }).populate('user service').sort({ appointmentTime: 1 });
};

// Static method to check time slot availability
bookingSchema.statics.isTimeSlotAvailable = async function(date, time, duration, excludeBookingId = null) {
  const startTime = new Date(`${date.toISOString().split('T')[0]}T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  
  const query = {
    appointmentDate: date,
    status: { $nin: ['cancelled', 'no-show'] },
    $or: [
      {
        appointmentTime: { $lt: time },
        // Check if existing booking ends after our start time
      },
      {
        appointmentTime: { $gte: time, $lt: endTime.toTimeString().substr(0, 5) }
      }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBookings = await this.find(query);
  return conflictingBookings.length === 0;
};

// Method to send reminder
bookingSchema.methods.sendReminder = async function(type = 'email') {
  const reminderService = type === 'email' ? 
    require('../utils/emailService') : 
    require('../utils/smsService');
  
  try {
    await reminderService.sendAppointmentReminder(this);
    this.reminders[type].sent = true;
    this.reminders[type].sentAt = new Date();
    await this.save();
    return true;
  } catch (error) {
    console.error(`Failed to send ${type} reminder:`, error);
    return false;
  }
};

// Method to cancel booking
bookingSchema.methods.cancel = function(reason, cancelledBy, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledAt: new Date(),
    cancelledBy,
    refundAmount
  };
  
  if (refundAmount > 0) {
    this.paymentStatus = 'refunded';
  }
  
  return this.save();
};

// Method to reschedule booking
bookingSchema.methods.reschedule = function(newDate, newTime, reason, rescheduledBy) {
  this.rescheduling = {
    originalDate: this.appointmentDate,
    originalTime: this.appointmentTime,
    reason,
    rescheduledAt: new Date(),
    rescheduledBy
  };
  
  this.appointmentDate = newDate;
  this.appointmentTime = newTime;
  this.status = 'rescheduled';
  
  // Reset reminders
  this.reminders.email.sent = false;
  this.reminders.sms.sent = false;
  
  return this.save();
};

// Indexes for better performance
bookingSchema.index({ user: 1, appointmentDate: -1 });
bookingSchema.index({ appointmentDate: 1, appointmentTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ staffMember: 1, appointmentDate: 1 });
bookingSchema.index({ invoiceNumber: 1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
