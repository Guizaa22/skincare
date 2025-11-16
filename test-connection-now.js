// Advanced MongoDB Atlas Connection Tester
const mongoose = require('mongoose');

console.log('');
console.log('='.repeat(60));
console.log('  🔍 ADVANCED CONNECTION TESTER');
console.log('='.repeat(60));
console.log('');

// Test multiple connection strings
const tests = [
  {
    name: 'Test 1: With skinsense123',
    connectionString: 'mongodb+srv://hamaguzien1842_db_user:skinsense123@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority'
  },
  {
    name: 'Test 2: With Habibhabib22',
    connectionString: 'mongodb+srv://hamaguzien1842_db_user:Habibhabib22@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority'
  },
  {
    name: 'Test 3: Default database',
    connectionString: 'mongodb+srv://hamaguzien1842_db_user:skinsense123@cluster0.zfog3zt.mongodb.net/?retryWrites=true&w=majority'
  }
];

let currentTest = 0;

function testConnection(test) {
  console.log('');
  console.log('🧪', test.name);
  console.log('');
  
  const conn = mongoose.createConnection(test.connectionString, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });
  
  conn.on('connected', () => {
    console.log('✅ SUCCESS!');
    console.log('');
    console.log('This connection works!');
    console.log('Database:', conn.name || 'default');
    console.log('');
    console.log('📝 Saving to .env file...');
    
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    if (envContent.includes('MONGODB_URI=')) {
      envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${test.connectionString}`);
    } else {
      envContent += `\nMONGODB_URI=${test.connectionString}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env updated!');
    console.log('');
    console.log('🚀 Now run: npm run dev');
    console.log('');
    
    conn.close();
    process.exit(0);
  });
  
  conn.on('error', (error) => {
    console.log('❌ Failed:', error.message);
    conn.close();
    
    currentTest++;
    if (currentTest < tests.length) {
      testConnection(tests[currentTest]);
    } else {
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('❌ All tests failed!');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('');
      console.log('The password change might not be active yet.');
      console.log('MongoDB Atlas can take 2-5 minutes to update.');
      console.log('');
      console.log('Please:');
      console.log('');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('   https://cloud.mongodb.com');
      console.log('');
      console.log('2. Database Access → Edit user');
      console.log('   User: hamaguzien1842_db_user');
      console.log('');
      console.log('3. Click "Edit Password"');
      console.log('');
      console.log('4. Choose "Autogenerate Secure Password"');
      console.log('   AND COPY IT!');
      console.log('');
      console.log('5. Click "Update User"');
      console.log('');
      console.log('6. Wait 3 minutes');
      console.log('');
      console.log('7. Run this script with your new password:');
      console.log('   node manual-setup.js');
      console.log('');
      process.exit(1);
    }
  });
}

// Start testing
testConnection(tests[currentTest]);

