const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload image
const uploadImage = async (filePath, folder = 'skinsense') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
};

// Helper function to delete image
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Image deletion failed');
  }
};

// Helper function to generate optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    format: 'auto',
    crop: 'fill',
    gravity: 'face'
  };
  
  const transformOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, transformOptions);
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl
};
