// Easy MongoDB Atlas Setup - Interactive
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  🚀 MONGODB ATLAS - EASY SETUP');
console.log('='.repeat(60));
console.log('');
console.log('Your cluster info:');
console.log('  Username: hamaguzien1842_db_user');
console.log('  Cluster: cluster0.zfog3zt.mongodb.net');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('📝 FIRST: Reset your password in MongoDB Atlas');
console.log('');
console.log('1. Go to: https://cloud.mongodb.com');
console.log('2. Left sidebar → "Database Access"');
console.log('3. Find user: hamaguzien1842_db_user');
console.log('4. Click "EDIT"');
console.log('5. Click "Edit Password"');
console.log('6. Set new password: skinsense123');
console.log('7. Click "Update User"');
console.log('');
console.log('ALSO: Allow IP Access');
console.log('');
console.log('1. Left sidebar → "Network Access"');
console.log('2. Click "Add IP Address"');
console.log('3. Click "Allow Access from Anywhere"');
console.log('4. Click "Confirm"');
console.log('5. Wait 2 minutes');
console.log('');
console.log('='.repeat(60));
console.log('');

rl.question('Enter your MongoDB password: ', (password) => {
  
  if (!password || password.trim() === '') {
    console.log('');
    console.log('❌ No password provided!');
    console.log('');
    rl.close();
    process.exit(1);
  }
  
  password = password.trim();
  
  // Build connection string
  const connectionString = `mongodb+srv://hamaguzien1842_db_user:${password}@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority`;
  
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
  const mongoose = require('mongoose');
  
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
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('🚀 Your database is ready!');
      console.log('');
      console.log('Now start your server:');
      console.log('');
      console.log('  npm run dev');
      console.log('');
      console.log('Then visit: http://localhost:3001');
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      
      mongoose.connection.close();
      rl.close();
      process.exit(0);
    })
    .catch((error) => {
      console.log('');
      console.log('❌ Connection failed!');
      console.log('');
      console.log('Error:', error.message);
      console.log('');
      
      if (error.message.includes('authentication') || error.message.includes('bad auth')) {
        console.log('💡 PASSWORD IS WRONG!');
        console.log('');
        console.log('Please:');
        console.log('1. Go to MongoDB Atlas → Database Access');
        console.log('2. Reset password for: hamaguzien1842_db_user');
        console.log('3. Use simple password: skinsense123');
        console.log('4. Run this script again: node setup-atlas-easy.js');
        console.log('');
      } else if (error.message.includes('IP')) {
        console.log('💡 IP NOT ALLOWED!');
        console.log('');
        console.log('Please:');
        console.log('1. Go to MongoDB Atlas → Network Access');
        console.log('2. Click "Add IP Address"');
        console.log('3. Click "Allow Access from Anywhere"');
        console.log('4. Wait 2-3 minutes');
        console.log('5. Run this script again: node setup-atlas-easy.js');
        console.log('');
      } else {
        console.log('💡 Check:');
        console.log('1. Internet connection is working');
        console.log('2. Firewall is not blocking MongoDB');
        console.log('3. Try again in a few minutes');
        console.log('');
      }
      
      rl.close();
      process.exit(1);
    });
});

