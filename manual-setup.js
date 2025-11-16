// Manual MongoDB Atlas Setup with Custom Password
const readline = require('readline');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  🔐 MANUAL MONGODB ATLAS SETUP');
console.log('='.repeat(60));
console.log('');
console.log('INSTRUCTIONS:');
console.log('');
console.log('1. Go to: https://cloud.mongodb.com/');
console.log('2. Database Access → Find: hamaguzien1842_db_user');
console.log('3. Click "EDIT" → "Edit Password"');
console.log('4. Click "Autogenerate Secure Password"');
console.log('5. COPY THE PASSWORD!');
console.log('6. Click "Update User"');
console.log('7. Wait 2 minutes');
console.log('8. Paste the password below');
console.log('');
console.log('='.repeat(60));
console.log('');

rl.question('Paste your MongoDB password here: ', (password) => {
  
  password = password.trim();
  
  if (!password) {
    console.log('❌ No password provided!');
    rl.close();
    process.exit(1);
  }
  
  // URL encode the password in case it has special characters
  const encodedPassword = encodeURIComponent(password);
  
  const connectionString = `mongodb+srv://hamaguzien1842_db_user:${encodedPassword}@cluster0.zfog3zt.mongodb.net/skinsense?retryWrites=true&w=majority`;
  
  console.log('');
  console.log('🧪 Testing connection...');
  console.log('');
  
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
      
      // Save to .env
      const envPath = path.join(__dirname, '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${connectionString}`);
      } else {
        envContent += `\nMONGODB_URI=${connectionString}\n`;
      }
      
      // Clean up
      envContent = envContent.split('\n').filter(line => line.trim() !== '' && !line.includes('DATABASE_URL') && !line.includes('POSTGRES_')).join('\n') + '\n';
      
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ .env file updated!');
      console.log('');
      console.log('🚀 Your database is ready!');
      console.log('');
      console.log('Start your server:');
      console.log('  npm run dev');
      console.log('');
      console.log('Then visit: http://localhost:3001');
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
      
      if (error.message.includes('authentication') || error.message.includes('bad auth')) {
        console.log('💡 Password is still wrong or not updated yet!');
        console.log('');
        console.log('Try this:');
        console.log('1. Wait 5 more minutes (password changes take time)');
        console.log('2. Or reset password again with a NEW password');
        console.log('3. Make sure you copy the EXACT password (no spaces)');
        console.log('4. Run this script again: node manual-setup.js');
      } else if (error.message.includes('IP')) {
        console.log('💡 IP not allowed!');
        console.log('');
        console.log('Go to Network Access → Add IP Address');
        console.log('Click "Allow Access from Anywhere"');
      }
      
      console.log('');
      rl.close();
      process.exit(1);
    });
});

