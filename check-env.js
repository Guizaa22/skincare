// Quick environment check
require('dotenv').config();

console.log('');
console.log('='.repeat(60));
console.log('  🔍 ENVIRONMENT CHECK');
console.log('='.repeat(60));
console.log('');

// Check critical environment variables
const checks = {
  'PORT': process.env.PORT || '3001',
  'NODE_ENV': process.env.NODE_ENV || 'development',
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ Set' : '❌ Not set',
  'JWT_SECRET': process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
  'SESSION_SECRET': process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set',
  'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '⚠️  Not set (optional)',
  'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '⚠️  Not set (optional)',
};

console.log('Environment Variables:');
console.log('');
Object.entries(checks).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

console.log('');
console.log('='.repeat(60));
console.log('');

// Check MongoDB connection
if (!process.env.MONGODB_URI) {
  console.log('❌ MONGODB_URI is not set!');
  console.log('');
  console.log('💡 You have two options:');
  console.log('');
  console.log('Option 1: Use MongoDB Atlas (Cloud - FREE, EASY)');
  console.log('   Run: node setup-mongodb-atlas.js');
  console.log('');
  console.log('Option 2: Use Local MongoDB');
  console.log('   1. Install MongoDB on your PC');
  console.log('   2. Add to .env: MONGODB_URI=mongodb://localhost:27017/skinsense');
  console.log('');
} else {
  console.log('✅ MongoDB connection string found!');
  console.log('');
  
  // Try to connect
  const mongoose = require('mongoose');
  
  console.log('🧪 Testing MongoDB connection...');
  console.log('');
  
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  })
    .then(() => {
      console.log('✅ MongoDB connection successful!');
      console.log('Database:', mongoose.connection.name);
      console.log('Host:', mongoose.connection.host);
      console.log('');
      console.log('🎉 Everything is ready!');
      console.log('');
      console.log('Run: npm run dev');
      console.log('');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      console.log('❌ MongoDB connection failed!');
      console.log('Error:', error.message);
      console.log('');
      console.log('💡 Solution: Run node setup-mongodb-atlas.js');
      console.log('');
      process.exit(1);
    });
}

