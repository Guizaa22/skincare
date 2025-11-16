// Complete setup: Add sample data + configure services
const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');
const sampleServices = require('./sample-data');
require('dotenv').config();

async function setupComplete() {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('  🚀 SETTING UP YOUR WEBSITE');
    console.log('='.repeat(60));
    console.log('');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB!');
    console.log('');

    // Check if services exist
    const serviceCount = await Service.countDocuments();
    console.log(`📊 Current services in database: ${serviceCount}`);
    
    if (serviceCount === 0) {
      console.log('');
      console.log('📝 Adding sample services...');
      
      await Service.insertMany(sampleServices.map(service => ({
        ...service,
        isActive: true
      })));
      
      console.log(`✅ Added ${sampleServices.length} sample services!`);
    } else {
      console.log('✅ Services already exist');
    }
    
    console.log('');

    // Check if admin user exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`👤 Admin users in database: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('');
      console.log('📝 Creating default admin account...');
      
      const admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@skinsense.com',
        phone: '+1234567890',
        password: 'Admin@123',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true
      });
      
      console.log('✅ Admin account created!');
      console.log('   Email: admin@skinsense.com');
      console.log('   Password: Admin@123');
      console.log('   ⚠️  Please change this password after first login!');
    } else {
      console.log('✅ Admin account already exists');
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('🎉 SETUP COMPLETE!');
    console.log('');
    console.log('Your website is ready with:');
    console.log(`  ✅ ${await Service.countDocuments()} Services`);
    console.log(`  ✅ ${await User.countDocuments()} Users`);
    console.log('');
    console.log('🌐 Visit: http://localhost:3001');
    console.log('');
    console.log('📋 Test accounts:');
    console.log('   Admin Login:');
    console.log('     Email: admin@skinsense.com');
    console.log('     Password: Admin@123');
    console.log('');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Setup failed!');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

setupComplete();

