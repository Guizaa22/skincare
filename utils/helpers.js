const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// Generate random string
exports.generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate random number
exports.generateRandomNumber = (min = 100000, max = 999999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Hash string using SHA256
exports.hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Format phone number
exports.formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

// Validate email format
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format
exports.isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned) && cleaned.length >= 10 && cleaned.length <= 15;
};

// Calculate age from date of birth
exports.calculateAge = (dateOfBirth) => {
  return moment().diff(moment(dateOfBirth), 'years');
};

// Check if date is in business hours
exports.isBusinessHours = (date, time) => {
  const appointmentDate = moment(date);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Check if it's a weekday (Monday to Saturday)
  const dayOfWeek = appointmentDate.day();
  if (dayOfWeek === 0) { // Sunday
    return false;
  }
  
  // Check business hours (9 AM to 6 PM)
  const timeInMinutes = hours * 60 + minutes;
  const openTime = 9 * 60; // 9:00 AM
  const closeTime = 18 * 60; // 6:00 PM
  
  return timeInMinutes >= openTime && timeInMinutes < closeTime;
};

// Generate time slots for a day
exports.generateTimeSlots = (startHour = 9, endHour = 18, intervalMinutes = 30) => {
  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
};

// Check if time slot is available
exports.isTimeSlotAvailable = (bookedSlots, requestedTime, duration) => {
  const requestedStart = moment(requestedTime, 'HH:mm');
  const requestedEnd = moment(requestedStart).add(duration, 'minutes');
  
  return !bookedSlots.some(slot => {
    const slotStart = moment(slot.time, 'HH:mm');
    const slotEnd = moment(slotStart).add(slot.duration, 'minutes');
    
    // Check for overlap
    return requestedStart.isBefore(slotEnd) && requestedEnd.isAfter(slotStart);
  });
};

// Format currency
exports.formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format date
exports.formatDate = (date, format = 'MMMM DD, YYYY') => {
  return moment(date).format(format);
};

// Format time
exports.formatTime = (time, format = 'h:mm A') => {
  return moment(time, 'HH:mm').format(format);
};

// Get days between dates
exports.getDaysBetween = (startDate, endDate) => {
  return moment(endDate).diff(moment(startDate), 'days');
};

// Check if date is holiday
exports.isHoliday = (date) => {
  const holidays = [
    '01-01', // New Year's Day
    '07-04', // Independence Day
    '12-25', // Christmas Day
    // Add more holidays as needed
  ];
  
  const dateString = moment(date).format('MM-DD');
  return holidays.includes(dateString);
};

// Generate pagination metadata
exports.generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages: totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: hasNext,
    hasPrev: hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Sanitize string for URL
exports.slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Generate invoice number
exports.generateInvoiceNumber = (prefix = 'SS', count = 1) => {
  const date = moment();
  const year = date.format('YYYY');
  const month = date.format('MM');
  const paddedCount = count.toString().padStart(4, '0');
  
  return `${prefix}-${year}${month}-${paddedCount}`;
};

// Validate password strength
exports.validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: [],
    score: 0
  };
  
  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('Password must be at least 6 characters long');
  } else {
    result.score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  } else {
    result.score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  } else {
    result.score += 1;
  }
  
  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('Password should contain at least one special character');
  } else {
    result.score += 1;
  }
  
  if (password.length >= 12) {
    result.score += 1;
  }
  
  return result;
};

// Generate secure token
exports.generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create JWT token
exports.createJWTToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
exports.verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Calculate treatment discount
exports.calculateDiscount = (basePrice, discountType, discountValue) => {
  let discount = 0;
  
  switch (discountType) {
    case 'percentage':
      discount = (basePrice * discountValue) / 100;
      break;
    case 'fixed':
      discount = discountValue;
      break;
    case 'buy_one_get_one':
      discount = basePrice * 0.5; // 50% off second item
      break;
    default:
      discount = 0;
  }
  
  return Math.min(discount, basePrice); // Discount can't exceed base price
};

// Generate QR code data
exports.generateQRCodeData = (type, data) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  switch (type) {
    case 'appointment':
      return `${baseUrl}/appointment/${data.id}`;
    case 'service':
      return `${baseUrl}/services/${data.id}`;
    case 'contact':
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nORG:${data.organization}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nEND:VCARD`;
    default:
      return data.toString();
  }
};

// Mask sensitive data
exports.maskEmail = (email) => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
  return `${maskedLocal}@${domain}`;
};

exports.maskPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ***-${cleaned.slice(6)}`;
  }
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
};

// Rate limiting helpers
exports.createRateLimitKey = (ip, action) => {
  return `rate_limit:${ip}:${action}`;
};

// File size helpers
exports.formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Color utilities for skin analysis
exports.skinToneColors = {
  'very-light': '#F7E7CE',
  'light': '#F3D5AB',
  'light-medium': '#E8B887',
  'medium': '#D4A574',
  'medium-dark': '#C19962',
  'dark': '#A67C52',
  'very-dark': '#8B4513'
};

// Business logic helpers
exports.calculateServiceDiscount = (services, promoCode) => {
  // Implement discount calculation logic
  let totalDiscount = 0;
  
  if (promoCode) {
    switch (promoCode.type) {
      case 'first_time':
        totalDiscount = services.reduce((sum, service) => sum + service.price, 0) * 0.1; // 10% off
        break;
      case 'loyalty':
        totalDiscount = 50; // $50 off
        break;
      case 'package':
        if (services.length >= 3) {
          totalDiscount = services.reduce((sum, service) => sum + service.price, 0) * 0.15; // 15% off
        }
        break;
    }
  }
  
  return totalDiscount;
};

// Error formatting
exports.formatError = (error) => {
  return {
    message: error.message,
    type: error.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };
};

// Success response formatter
exports.formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message: message,
    data: data
  };
};

// Error response formatter
exports.formatErrorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message: message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
};

module.exports = exports;
