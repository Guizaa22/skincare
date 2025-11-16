// Remove placeholder Google OAuth credentials from .env
const fs = require('fs');
const path = require('path');

console.log('');
console.log('🔧 Fixing Google OAuth configuration...');
console.log('');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Remove or comment out placeholder Google OAuth credentials
  envContent = envContent
    .replace(/^GOOGLE_CLIENT_ID=your_google_client_id.*$/gm, '# GOOGLE_CLIENT_ID=')
    .replace(/^GOOGLE_CLIENT_SECRET=your_google.*$/gm, '# GOOGLE_CLIENT_SECRET=')
    .replace(/^GOOGLE_CLIENT_ID=.*your.*$/gm, '# GOOGLE_CLIENT_ID=')
    .replace(/^GOOGLE_CLIENT_SECRET=.*your.*$/gm, '# GOOGLE_CLIENT_SECRET=');
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Removed placeholder Google OAuth credentials');
  console.log('');
  console.log('Google OAuth is now disabled.');
  console.log('Your website will work without it!');
  console.log('');
  console.log('To enable Google OAuth later:');
  console.log('   1. Run: node configure-apis.js');
  console.log('   2. Enter real Google credentials');
  console.log('');
} else {
  console.log('❌ .env file not found');
}

console.log('🔄 Restart your server now:');
console.log('   taskkill /F /IM node.exe');
console.log('   npm run dev');
console.log('');

