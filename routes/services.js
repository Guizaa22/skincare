const express = require('express');
const Service = require('../models/Service');
const {
  validateService,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

const {
  protect,
  authorize,
  optionalAuth
} = require('../middleware/auth');

const {
  uploadServiceImages,
  handleUploadErrors,
  cleanupTempFiles
} = require('../middleware/upload');

const { uploadImage, deleteImage } = require('../config/cloudinary');
const { formatSuccessResponse, formatErrorResponse, generatePagination } = require('../utils/helpers');

const router = express.Router();

// Public routes
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const search = req.query.search;
    const sort = req.query.sort || 'displayOrder';
    const featured = req.query.featured;
    const popular = req.query.popular;

    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (popular === 'true') {
      query.isPopular = true;
    }

    // Get services with pagination
    const [services, total] = await Promise.all([
      Service.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Service.countDocuments(query)
    ]);

    const pagination = generatePagination(page, limit, total);

    res.status(200).json(formatSuccessResponse({
      services: services.map(service => ({
        id: service._id,
        name: service.name,
        shortDescription: service.shortDescription,
        category: service.category,
        duration: service.duration,
        price: service.price,
        formattedPrice: service.formattedPrice,
        images: service.images,
        rating: service.rating,
        isPopular: service.isPopular,
        isFeatured: service.isFeatured
      })),
      pagination
    }));

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json(formatErrorResponse('Failed to get services', error.message));
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const categoryMap = {
      'facial-treatments': 'Facial Treatments',
      'body-treatments': 'Body Treatments',
      'anti-aging': 'Anti-Aging',
      'acne-treatments': 'Acne Treatments',
      'skin-analysis': 'Skin Analysis',
      'chemical-peels': 'Chemical Peels',
      'microdermabrasion': 'Microdermabrasion',
      'laser-treatments': 'Laser Treatments',
      'consultation': 'Consultation',
      'packages': 'Packages'
    };

    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: categoryMap[cat._id] || cat._id,
      count: cat.count
    }));

    res.status(200).json(formatSuccessResponse({
      categories: formattedCategories
    }));

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(formatErrorResponse('Failed to get categories', error.message));
  }
});

router.get('/featured', async (req, res) => {
  try {
    const services = await Service.getFeatured(parseInt(req.query.limit) || 3);

    res.status(200).json(formatSuccessResponse({
      services: services.map(service => ({
        id: service._id,
        name: service.name,
        shortDescription: service.shortDescription,
        category: service.category,
        duration: service.duration,
        price: service.price,
        formattedPrice: service.formattedPrice,
        images: service.images,
        rating: service.rating
      }))
    }));

  } catch (error) {
    console.error('Get featured services error:', error);
    res.status(500).json(formatErrorResponse('Failed to get featured services', error.message));
  }
});

router.get('/popular', async (req, res) => {
  try {
    const services = await Service.getPopular(parseInt(req.query.limit) || 6);

    res.status(200).json(formatSuccessResponse({
      services: services.map(service => ({
        id: service._id,
        name: service.name,
        shortDescription: service.shortDescription,
        category: service.category,
        duration: service.duration,
        price: service.price,
        formattedPrice: service.formattedPrice,
        images: service.images,
        rating: service.rating
      }))
    }));

  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json(formatErrorResponse('Failed to get popular services', error.message));
  }
});

router.get('/:id', 
  optionalAuth,
  validateObjectId('id'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

      if (!service || !service.isActive) {
        return res.status(404).json(
          formatErrorResponse('Service not found')
        );
      }

      res.status(200).json(formatSuccessResponse({
        service: {
          id: service._id,
          name: service.name,
          description: service.description,
          shortDescription: service.shortDescription,
          category: service.category,
          duration: service.duration,
          price: service.price,
          formattedPrice: service.formattedPrice,
          images: service.images,
          benefits: service.benefits,
          skinTypes: service.skinTypes,
          targetConcerns: service.targetConcerns,
          contraindications: service.contraindications,
          aftercare: service.aftercare,
          staffRequired: service.staffRequired,
          products: service.products,
          rating: service.rating,
          reviews: service.reviews.slice(0, 5), // Show only first 5 reviews
          faqs: service.faqs,
          isPopular: service.isPopular,
          isFeatured: service.isFeatured,
          ageRestriction: service.ageRestriction,
          bookingAdvanceNotice: service.bookingAdvanceNotice
        }
      }));

    } catch (error) {
      console.error('Get service error:', error);
      res.status(500).json(formatErrorResponse('Failed to get service', error.message));
    }
  }
);

router.post('/:id/review',
  protect,
  validateObjectId('id'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json(
          formatErrorResponse('Rating must be between 1 and 5')
        );
      }

      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json(
          formatErrorResponse('Service not found')
        );
      }

      // Check if user has completed a booking for this service
      const Booking = require('../models/Booking');
      const completedBooking = await Booking.findOne({
        user: req.user.id,
        service: service._id,
        status: 'completed'
      });

      if (!completedBooking) {
        return res.status(400).json(
          formatErrorResponse('You can only review services you have completed')
        );
      }

      // Add or update review
      await service.addReview(req.user.id, rating, comment);

      res.status(200).json(formatSuccessResponse(null, 'Review added successfully'));

    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json(formatErrorResponse('Failed to add review', error.message));
    }
  }
);

// Admin routes
router.use(protect);
router.use(authorize('admin'));

router.post('/',
  validateService,
  handleValidationErrors,
  uploadServiceImages,
  handleUploadErrors,
  cleanupTempFiles,
  async (req, res) => {
    try {
      const serviceData = { ...req.body };

      // Upload images if provided
      if (req.files && req.files.length > 0) {
        const uploadedImages = [];
        
        for (const file of req.files) {
          try {
            const result = await uploadImage(file.path, 'skinsense/services');
            uploadedImages.push({
              public_id: result.public_id,
              url: result.url
            });
          } catch (error) {
            console.error('Error uploading service image:', error);
          }
        }
        
        serviceData.images = uploadedImages;
      }

      const service = await Service.create(serviceData);

      res.status(201).json(formatSuccessResponse({
        service
      }, 'Service created successfully'));

    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json(formatErrorResponse('Failed to create service', error.message));
    }
  }
);

router.put('/:id',
  validateObjectId('id'),
  validateService,
  handleValidationErrors,
  uploadServiceImages,
  handleUploadErrors,
  cleanupTempFiles,
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json(
          formatErrorResponse('Service not found')
        );
      }

      const updateData = { ...req.body };

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        // Delete old images
        if (service.images && service.images.length > 0) {
          for (const image of service.images) {
            try {
              await deleteImage(image.public_id);
            } catch (error) {
              console.error('Error deleting old service image:', error);
            }
          }
        }

        // Upload new images
        const uploadedImages = [];
        for (const file of req.files) {
          try {
            const result = await uploadImage(file.path, 'skinsense/services');
            uploadedImages.push({
              public_id: result.public_id,
              url: result.url
            });
          } catch (error) {
            console.error('Error uploading service image:', error);
          }
        }
        
        updateData.images = uploadedImages;
      }

      const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json(formatSuccessResponse({
        service: updatedService
      }, 'Service updated successfully'));

    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json(formatErrorResponse('Failed to update service', error.message));
    }
  }
);

router.delete('/:id',
  validateObjectId('id'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json(
          formatErrorResponse('Service not found')
        );
      }

      // Check if service has active bookings
      const Booking = require('../models/Booking');
      const activeBookings = await Booking.countDocuments({
        service: service._id,
        status: { $in: ['pending', 'confirmed'] },
        appointmentDate: { $gte: new Date() }
      });

      if (activeBookings > 0) {
        return res.status(400).json(
          formatErrorResponse('Cannot delete service with active bookings')
        );
      }

      // Deactivate instead of deleting
      service.isActive = false;
      await service.save();

      res.status(200).json(formatSuccessResponse(null, 'Service deactivated successfully'));

    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json(formatErrorResponse('Failed to delete service', error.message));
    }
  }
);

module.exports = router;
