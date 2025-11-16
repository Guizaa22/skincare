// Fix permissions and setup database
const mongoose = require('mongoose');
require('dotenv').config();

console.log('');
console.log('='.repeat(60));
console.log('  🔧 DATABASE PERMISSIONS CHECKER');
console.log('='.repeat(60));
console.log('');

async function checkAndFix() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Connected!');
    console.log('');

    // Test write permissions
    console.log('🧪 Testing write permissions...');
    const testCollection = mongoose.connection.db.collection('__test__');
    
    try {
      await testCollection.insertOne({ test: true });
      await testCollection.deleteOne({ test: true });
      console.log('✅ Write permissions: OK');
      console.log('');
      
      // If we reach here, permissions are good
      console.log('✅ Database is properly configured!');
      console.log('');
      console.log('Now run: node setup-complete.js');
      console.log('');
      
    } catch (writeError) {
      console.log('❌ Write permissions: DENIED');
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('❌ DATABASE PERMISSION ERROR!');
      console.log('');
      console.log('Your MongoDB user doesn\'t have write permissions.');
      console.log('');
      console.log('🔧 HOW TO FIX:');
      console.log('');
      console.log('1. Go to: https://cloud.mongodb.com/');
      console.log('');
      console.log('2. Click "Database Access" (left sidebar)');
      console.log('');
      console.log('3. Find user: "skinsense"');
      console.log('');
      console.log('4. Click "EDIT" button');
      console.log('');
      console.log('5. Database User Privileges:');
      console.log('   Change to: "Atlas admin"');
      console.log('   OR');
      console.log('   Select: "Read and write to any database"');
      console.log('');
      console.log('6. Click "Update User"');
      console.log('');
      console.log('7. Wait 2 minutes');
      console.log('');
      console.log('8. Run this again: node fix-and-setup.js');
      console.log('');
      console.log('='.repeat(60));
      console.log('');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

checkAndFix();

