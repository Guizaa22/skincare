// Database setup script
// Run this script to initialize your database with sample data

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Service = require('./models/Service');
const sampleServices = require('./sample-data');

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    console.log('🔍 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI value:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skinsense';
    console.log('📡 Using connection URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing data...');
    await Service.deleteMany({});
    await User.deleteMany({ role: 'admin' }); // Only clear admin users
    
    // Insert sample services
    console.log('📋 Inserting sample services...');
    const services = await Service.insertMany(sampleServices);
    console.log(`✅ Inserted ${services.length} services`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@skinsense.com' });
    
    if (!adminExists) {
      const adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: process.env.ADMIN_EMAIL || 'admin@skinsense.com',
        phone: '+1234567890',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      });
      console.log(`✅ Admin user created: ${adminUser.email}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create sample client user
    console.log('👤 Creating sample client user...');
    const clientExists = await User.findOne({ email: 'client@example.com' });
    
    if (!clientExists) {
      const clientUser = await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'client@example.com',
        phone: '+1234567891',
        password: 'password123',
        role: 'client',
        skinType: 'combination',
        skinConcerns: ['acne', 'aging'],
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      });
      console.log(`✅ Sample client user created: ${clientUser.email}`);
    } else {
      console.log('ℹ️ Sample client user already exists');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@skinsense.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('Client: client@example.com / password123');
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
