// Quick MongoDB Atlas connection setup
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log('');
console.log('='.repeat(60));
console.log('  🚀 CONNECTING TO MONGODB ATLAS');
console.log('='.repeat(60));
console.log('');

// Your connection string (replace <db_password> with your actual password)
const connectionString = 'mongodb+srv://hamaguzien1842_db_user:Habibhabib22@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority';

console.log('📝 Updating .env file...');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Update MONGODB_URI
if (envContent.includes('MONGODB_URI=')) {
  envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${connectionString}`);
} else {
  envContent += `\nMONGODB_URI=${connectionString}\n`;
}

// Remove PostgreSQL variables
envContent = envContent.replace(/DATABASE_URL=.*/g, '');
envContent = envContent.replace(/POSTGRES_.*=.*/g, '');
envContent = envContent.split('\n').filter(line => line.trim() !== '').join('\n') + '\n';

fs.writeFileSync(envPath, envContent);

console.log('✅ .env file updated!');
console.log('');
console.log('🧪 Testing connection...');
console.log('');

// Test connection
mongoose.connect(connectionString, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
})
  .then(() => {
    console.log('');
    console.log('🎉 SUCCESS! MongoDB Atlas connected!');
    console.log('');
    console.log('✅ Database:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);
    console.log('✅ Status: Connected');
    console.log('');
    console.log('🚀 Starting your server...');
    console.log('');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.log('');
    console.log('❌ Connection failed!');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('💡 The password is wrong!');
      console.log('');
      console.log('Please edit connect-atlas.js and replace the password in the connection string.');
      console.log('');
      console.log('Your connection string format:');
      console.log('mongodb+srv://hamaguzien1842_db_user:YOUR_PASSWORD@cluster0.zfog3zt.mongodb.net/skinsense');
      console.log('');
    } else if (error.message.includes('IP')) {
      console.log('💡 IP not allowed!');
      console.log('');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Network Access → Add IP Address');
      console.log('3. Click "Allow Access from Anywhere"');
      console.log('');
    }
    
    process.exit(1);
  });

