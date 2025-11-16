// Connect with new password
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Your new password
const password = 'LQmPJf5uHwpK2WaR';
const encodedPassword = encodeURIComponent(password);

// Connection string with new password
const connectionString = `mongodb+srv://skinsense:${encodedPassword}@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority`;

console.log('');
console.log('='.repeat(60));
console.log('  🚀 CONNECTING TO MONGODB ATLAS');
console.log('='.repeat(60));
console.log('');
console.log('📝 Updating .env file...');

// Update .env file
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

// Remove PostgreSQL leftovers
envContent = envContent.split('\n')
  .filter(line => line.trim() !== '' && !line.includes('DATABASE_URL') && !line.includes('POSTGRES_'))
  .join('\n') + '\n';

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
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉');
    console.log('');
    console.log('✅ MongoDB Atlas Connected!');
    console.log('✅ Database:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);
    console.log('✅ User: skinsense');
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('🎯 Database is ready!');
    console.log('');
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.log('');
    console.log('❌ Connection failed!');
    console.log('Error:', error.message);
    console.log('');
    process.exit(1);
  });

