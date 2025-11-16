// Quick fix to update MongoDB URI
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  🔧 MONGODB SETUP FIX');
console.log('='.repeat(60));
console.log('');
console.log('Your current setup is trying to connect to local MongoDB,');
console.log('but you don\'t have it installed.');
console.log('');
console.log('Let\'s use MongoDB Atlas instead (FREE cloud database)!');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('📝 Quick Setup (takes 2 minutes):');
console.log('');
console.log('1. Go to: https://www.mongodb.com/cloud/atlas/register');
console.log('   - Click "Sign up" (use Google/Email)');
console.log('   - It\'s 100% FREE forever!');
console.log('');
console.log('2. Create FREE Cluster:');
console.log('   - Click "Build a Database" (green button)');
console.log('   - Choose "M0" (FREE)');
console.log('   - Select any region close to you');
console.log('   - Click "Create"');
console.log('');
console.log('3. Setup Security:');
console.log('   - Username: skinsense');
console.log('   - Password: skinsense123  (or anything you want)');
console.log('   - Click "Create User"');
console.log('');
console.log('4. Network Access:');
console.log('   - Click "Add My Current IP Address"');
console.log('   - Or "Allow Access from Anywhere" (easier)');
console.log('   - Click "Finish and Close"');
console.log('');
console.log('5. Get Connection String:');
console.log('   - Click "Connect"');
console.log('   - Click "Connect your application"');
console.log('   - Copy the connection string');
console.log('   - Replace <password> with your actual password');
console.log('');
console.log('Example connection string:');
console.log('mongodb+srv://skinsense:skinsense123@cluster0.xxxxx.mongodb.net/skinsense');
console.log('');
console.log('='.repeat(60));
console.log('');

rl.question('Paste your MongoDB Atlas connection string here:\n', (connectionString) => {
  
  connectionString = connectionString.trim();
  
  // Validate
  if (!connectionString) {
    console.log('');
    console.log('❌ No connection string provided!');
    console.log('');
    console.log('For now, I\'ll remove the local MongoDB URI so the server can start.');
    console.log('You can add MongoDB Atlas later.');
    console.log('');
    
    // Remove MongoDB URI
    updateEnvFile('');
    
    console.log('✅ Updated! Server will run without database.');
    console.log('');
    console.log('To add database later:');
    console.log('   1. Run: node fix-mongodb.js');
    console.log('   2. Follow the setup steps');
    console.log('');
    
    rl.close();
    process.exit(0);
  }
  
  if (!connectionString.startsWith('mongodb+srv://') && !connectionString.startsWith('mongodb://')) {
    console.log('');
    console.log('❌ Invalid connection string!');
    console.log('It must start with "mongodb+srv://" or "mongodb://"');
    console.log('');
    rl.close();
    process.exit(1);
  }
  
  if (connectionString.includes('<password>')) {
    console.log('');
    console.log('❌ Don\'t forget to replace <password> with your actual password!');
    console.log('');
    rl.close();
    process.exit(1);
  }
  
  // Update .env file
  updateEnvFile(connectionString);
  
  console.log('');
  console.log('✅ .env file updated!');
  console.log('');
  console.log('🧪 Testing connection...');
  
  // Test connection
  const mongoose = require('mongoose');
  
  mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  })
    .then(() => {
      console.log('');
      console.log('🎉 SUCCESS! MongoDB Atlas connected!');
      console.log('');
      console.log('Database:', mongoose.connection.name);
      console.log('Status: ✅ Connected');
      console.log('');
      console.log('🚀 Now start your server:');
      console.log('   npm run dev');
      console.log('');
      
      mongoose.connection.close();
      rl.close();
      process.exit(0);
    })
    .catch((error) => {
      console.log('');
      console.log('❌ Connection failed!');
      console.log('Error:', error.message);
      console.log('');
      
      if (error.message.includes('authentication') || error.message.includes('password')) {
        console.log('💡 The password is incorrect!');
        console.log('   - Check your username and password');
        console.log('   - Make sure you replaced <password>');
        console.log('   - Try resetting password in MongoDB Atlas');
      } else if (error.message.includes('IP') || error.message.includes('not allowed')) {
        console.log('💡 IP not allowed!');
        console.log('   - Go to Network Access in MongoDB Atlas');
        console.log('   - Click "Allow Access from Anywhere"');
      }
      
      console.log('');
      console.log('Run this script again when fixed: node fix-mongodb.js');
      console.log('');
      
      rl.close();
      process.exit(1);
    });
});

function updateEnvFile(connectionString) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update MongoDB URI
  if (connectionString) {
    if (envContent.includes('MONGODB_URI=')) {
      envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${connectionString}`);
    } else {
      envContent += `\nMONGODB_URI=${connectionString}\n`;
    }
  } else {
    // Remove MongoDB URI
    envContent = envContent.replace(/MONGODB_URI=.*/g, '# MONGODB_URI=');
  }
  
  // Remove any PostgreSQL leftovers
  envContent = envContent.replace(/DATABASE_URL=.*/g, '');
  envContent = envContent.replace(/POSTGRES_.*=.*/g, '');
  
  // Clean up
  envContent = envContent.split('\n')
    .filter(line => line.trim() !== '')
    .join('\n') + '\n';
  
  fs.writeFileSync(envPath, envContent);
}

