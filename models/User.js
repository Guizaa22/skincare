const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: function() {
      return !this.googleId; // Only required if not using Google OAuth
    },
    unique: true,
    sparse: true, // Allow null values for unique index
    match: [
      /^\+?[\d\s\-\(\)]+$/,
      'Please provide a valid phone number'
    ]
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Only required if not using Google OAuth
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allow null values for unique index
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  avatar: {
    public_id: String,
    url: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1/avatar-placeholder.png'
    }
  },
  role: {
    type: String,
    enum: ['client', 'admin', 'staff'],
    default: 'client'
  },
  isEmailVerified: {
    type: Boolean,
    default: function() {
      return this.provider === 'google'; // Auto-verify Google accounts
    }
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  phoneVerificationCode: String,
  phoneVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  skinType: {
    type: String,
    enum: ['oily', 'dry', 'combination', 'sensitive', 'normal'],
    default: 'normal'
  },
  skinConcerns: [{
    type: String,
    enum: ['acne', 'aging', 'dryness', 'sensitivity', 'pigmentation', 'rosacea', 'other']
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  medicalHistory: {
    type: String,
    maxlength: [500, 'Medical history cannot exceed 500 characters']
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    appointmentReminders: {
      type: Boolean,
      default: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'United States'
    }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for user's bookings
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Skip password hashing if password is not modified or if user is using Google OAuth
  if (!this.isModified('password') || !this.password || this.provider === 'google') return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE 
    }
  );
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
  
  this.emailVerificationToken = verificationToken;
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Method to generate phone verification code
userSchema.methods.getPhoneVerificationCode = function() {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  
  this.phoneVerificationCode = verificationCode;
  this.phoneVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return verificationCode;
};

// Method to generate reset password token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
