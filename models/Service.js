const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
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
    ]
  },
  duration: {
    type: Number,
    required: [true, 'Service duration is required'],
    min: [15, 'Minimum duration is 15 minutes'],
    max: [480, 'Maximum duration is 8 hours']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    public_id: String,
    url: String
  }],
  benefits: [{
    type: String,
    trim: true,
    maxlength: [100, 'Benefit description cannot exceed 100 characters']
  }],
  skinTypes: [{
    type: String,
    enum: ['oily', 'dry', 'combination', 'sensitive', 'normal', 'all']
  }],
  targetConcerns: [{
    type: String,
    enum: ['acne', 'aging', 'dryness', 'sensitivity', 'pigmentation', 'rosacea', 'maintenance']
  }],
  contraindications: [{
    type: String,
    trim: true,
    maxlength: [100, 'Contraindication cannot exceed 100 characters']
  }],
  aftercare: [{
    type: String,
    trim: true,
    maxlength: [200, 'Aftercare instruction cannot exceed 200 characters']
  }],
  staffRequired: {
    type: String,
    enum: ['esthetician', 'dermatologist', 'any'],
    default: 'esthetician'
  },
  equipment: [{
    type: String,
    trim: true
  }],
  products: [{
    name: String,
    brand: String,
    description: String
  }],
  preparationTime: {
    type: Number,
    default: 15,
    min: [0, 'Preparation time cannot be negative']
  },
  cleanupTime: {
    type: Number,
    default: 15,
    min: [0, 'Cleanup time cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  ageRestriction: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 120
    }
  },
  bookingAdvanceNotice: {
    type: Number,
    default: 24, // hours
    min: [0, 'Advance notice cannot be negative']
  },
  maxBookingsPerDay: {
    type: Number,
    default: 10,
    min: [1, 'Must allow at least 1 booking per day']
  },
  seasonalAvailability: {
    start: Date,
    end: Date
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  faqs: [{
    question: {
      type: String,
      required: true,
      maxlength: [200, 'Question cannot exceed 200 characters']
    },
    answer: {
      type: String,
      required: true,
      maxlength: [500, 'Answer cannot exceed 500 characters']
    }
  }],
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bookings
serviceSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'service',
  justOne: false
});

// Virtual for total duration including prep and cleanup
serviceSchema.virtual('totalDuration').get(function() {
  return this.duration + this.preparationTime + this.cleanupTime;
});

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Pre-save middleware to calculate average rating
serviceSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
  next();
});

// Static method to get services by category
serviceSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ displayOrder: 1, name: 1 });
};

// Static method to get popular services
serviceSchema.statics.getPopular = function(limit = 6) {
  return this.find({ isPopular: true, isActive: true })
    .sort({ rating: -1, displayOrder: 1 })
    .limit(limit);
};

// Static method to get featured services
serviceSchema.statics.getFeatured = function(limit = 3) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ displayOrder: 1 })
    .limit(limit);
};

// Method to add review
serviceSchema.methods.addReview = function(userId, rating, comment) {
  const existingReview = this.reviews.find(review => 
    review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.date = Date.now();
  } else {
    this.reviews.push({
      user: userId,
      rating,
      comment,
      date: Date.now()
    });
  }
  
  return this.save();
};

// Indexes for better performance
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ isPopular: 1, isActive: 1 });
serviceSchema.index({ isFeatured: 1, isActive: 1 });
serviceSchema.index({ 'rating.average': -1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
