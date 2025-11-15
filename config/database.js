const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔍 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI value:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/skinsense';
    
    console.log('Using MongoDB URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Server will run without database functionality');
    console.log('💡 To enable database features, install and start MongoDB:');
    console.log('   - Download MongoDB from: https://www.mongodb.com/try/download/community');
    console.log('   - Or use MongoDB Atlas cloud service');
    // Don't exit, continue without database
  }
};

module.exports = connectDB;
