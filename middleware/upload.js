const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Temporary storage - files will be uploaded to Cloudinary
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File size limits (in bytes)
const fileSizeLimits = {
  avatar: 5 * 1024 * 1024, // 5MB for avatar
  service: 10 * 1024 * 1024, // 10MB for service images
  booking: 15 * 1024 * 1024, // 15MB for booking photos (before/after)
  general: 5 * 1024 * 1024 // 5MB for general uploads
};

// Create multer instance with dynamic limits
const createUpload = (maxSize = fileSizeLimits.general) => {
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: maxSize,
      files: 10 // Maximum 10 files per request
    }
  });
};

// Avatar upload middleware
exports.uploadAvatar = createUpload(fileSizeLimits.avatar).single('avatar');

// Service images upload middleware
exports.uploadServiceImages = createUpload(fileSizeLimits.service).array('images', 5);

// Booking photos upload middleware
exports.uploadBookingPhotos = createUpload(fileSizeLimits.booking).fields([
  { name: 'beforePhotos', maxCount: 5 },
  { name: 'afterPhotos', maxCount: 5 }
]);

// General file upload middleware
exports.uploadGeneral = createUpload().single('file');

// Multiple files upload middleware
exports.uploadMultiple = createUpload().array('files', 5);

// Handle multer errors
exports.handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size allowed is 10MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields.';
        break;
      case 'MISSING_FIELD_NAME':
        message = 'Field name missing.';
        break;
      default:
        message = error.message;
    }
    
    return res.status(400).json({
      success: false,
      message: message
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.'
    });
  }
  
  next(error);
};

// Validate image dimensions
exports.validateImageDimensions = (minWidth = 100, minHeight = 100, maxWidth = 4000, maxHeight = 4000) => {
  return async (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    try {
      const sharp = require('sharp');
      const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
      
      for (const file of files) {
        if (file) {
          const metadata = await sharp(file.path).metadata();
          
          if (metadata.width < minWidth || metadata.height < minHeight) {
            return res.status(400).json({
              success: false,
              message: `Image dimensions too small. Minimum size is ${minWidth}x${minHeight} pixels.`
            });
          }
          
          if (metadata.width > maxWidth || metadata.height > maxHeight) {
            return res.status(400).json({
              success: false,
              message: `Image dimensions too large. Maximum size is ${maxWidth}x${maxHeight} pixels.`
            });
          }
        }
      }
      
      next();
    } catch (error) {
      console.error('Image validation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file.'
      });
    }
  };
};

// Clean up temporary files
exports.cleanupTempFiles = (req, res, next) => {
  const fs = require('fs');
  
  // Clean up files after response is sent
  res.on('finish', () => {
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    files.forEach(file => {
      if (file && file.path) {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error('Error deleting temp file:', err);
          }
        });
      }
    });
  });
  
  next();
};

// Validate file types for specific contexts
exports.validateFileType = (allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      if (file && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
    }
    
    next();
  };
};

// Compress images before upload
exports.compressImages = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  try {
    const sharp = require('sharp');
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      if (file && file.mimetype.startsWith('image/')) {
        const compressedPath = `${file.path}-compressed`;
        
        await sharp(file.path)
          .resize(1200, 1200, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toFile(compressedPath);
        
        // Replace original file with compressed version
        const fs = require('fs');
        fs.unlinkSync(file.path);
        fs.renameSync(compressedPath, file.path);
      }
    }
    
    next();
  } catch (error) {
    console.error('Image compression error:', error);
    next(error);
  }
};

// Sanitize file names
exports.sanitizeFilename = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
  
  files.forEach(file => {
    if (file) {
      // Remove potentially dangerous characters
      file.originalname = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100); // Limit filename length
    }
  });
  
  next();
};

// Log upload activities
exports.logUpload = (req, res, next) => {
  if (req.file || req.files) {
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const fileInfo = files.map(file => ({
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    console.log(`File upload - User: ${req.user?.email || 'Anonymous'}, Files:`, fileInfo);
  }
  
  next();
};

module.exports = exports;
