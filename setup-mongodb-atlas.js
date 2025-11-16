// MongoDB Atlas Cloud Database Setup
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  ☁️  MONGODB ATLAS CLOUD DATABASE SETUP');
console.log('='.repeat(60));
console.log('');
console.log('📝 Step-by-Step Instructions:');
console.log('');
console.log('1. Go to: https://www.mongodb.com/cloud/atlas/register');
console.log('   - Sign up (FREE forever)');
console.log('');
console.log('2. Create a FREE cluster:');
console.log('   - Click "Build a Database"');
console.log('   - Select "M0 FREE" (Shared)');
console.log('   - Choose any region (closest to you)');
console.log('   - Click "Create"');
console.log('');
console.log('3. Create a database user:');
console.log('   - Username: skinsense');
console.log('   - Password: (create a simple password, like "skinsense123")');
console.log('   - Click "Create User"');
console.log('');
console.log('4. Add IP Address:');
console.log('   - Click "Add My Current IP Address"');
console.log('   - Or click "Allow Access from Anywhere" (0.0.0.0/0)');
console.log('   - Click "Finish and Close"');
console.log('');
console.log('5. Get Connection String:');
console.log('   - Click "Connect"');
console.log('   - Click "Connect your application"');
console.log('   - Copy the connection string');
console.log('   - Replace <password> with your actual password');
console.log('');
console.log('Example:');
console.log('mongodb+srv://skinsense:skinsense123@cluster0.xxxxx.mongodb.net/skinsense');
console.log('');
console.log('='.repeat(60));
console.log('');

rl.question('Paste your MongoDB Atlas connection string here:\n', (connectionString) => {
  
  connectionString = connectionString.trim();
  
  // Validate format
  if (!connectionString.startsWith('mongodb+srv://') && !connectionString.startsWith('mongodb://')) {
    console.log('');
    console.log('❌ Error: Connection string must start with "mongodb+srv://" or "mongodb://"');
    console.log('');
    rl.close();
    process.exit(1);
  }
  
  // Check if password placeholder is still there
  if (connectionString.includes('<password>')) {
    console.log('');
    console.log('❌ Error: Replace <password> with your actual password!');
    console.log('');
    rl.close();
    process.exit(1);
  }
  
  console.log('');
  console.log('📝 Updating .env file...');
  
  // Read current .env or create new one
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add MONGODB_URI
  if (envContent.includes('MONGODB_URI=')) {
    envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${connectionString}`);
  } else {
    envContent += `\nMONGODB_URI=${connectionString}\n`;
  }
  
  // Remove PostgreSQL variables if they exist
  envContent = envContent.replace(/DATABASE_URL=.*/g, '');
  envContent = envContent.replace(/POSTGRES_.*/g, '');
  
  // Clean up empty lines
  envContent = envContent.split('\n').filter(line => line.trim() !== '').join('\n') + '\n';
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file updated!');
  console.log('');
  console.log('🧪 Testing connection...');
  
  // Test connection
  const mongoose = require('mongoose');
  
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => {
      console.log('✅ SUCCESS! MongoDB Atlas connected!');
      console.log('');
      console.log('🎉 Database is ready!');
      console.log('');
      console.log('📊 Database details:');
      console.log('   Connection: MongoDB Atlas (Cloud)');
      console.log('   Database:', mongoose.connection.name || 'skinsense');
      console.log('   Status: ✅ Connected');
      console.log('');
      console.log('🚀 Next steps:');
      console.log('   1. Run: npm run dev');
      console.log('   2. Visit: http://localhost:3001');
      console.log('');
      
      mongoose.connection.close();
      rl.close();
      process.exit(0);
    })
    .catch((error) => {
      console.log('❌ Connection failed!');
      console.log('Error:', error.message);
      console.log('');
      
      if (error.message.includes('authentication failed')) {
        console.log('💡 SOLUTION:');
        console.log('');
        console.log('1. Check your username and password are correct');
        console.log('2. Make sure you replaced <password> with actual password');
        console.log('3. Try resetting the password in MongoDB Atlas:');
        console.log('   - Database Access → Edit User → Reset Password');
        console.log('');
      } else if (error.message.includes('IP') || error.message.includes('not allowed')) {
        console.log('💡 SOLUTION:');
        console.log('');
        console.log('1. Go to MongoDB Atlas Dashboard');
        console.log('2. Network Access → Add IP Address');
        console.log('3. Click "Allow Access from Anywhere"');
        console.log('4. Click "Confirm"');
        console.log('');
      } else {
        console.log('💡 Check:');
        console.log('   1. Connection string is complete');
        console.log('   2. Internet connection is working');
        console.log('   3. Try again in a few minutes');
        console.log('');
      }
      
      rl.close();
      process.exit(1);
    });
});

