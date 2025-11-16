// Complete Google OAuth Setup Tool
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  🔐 GOOGLE OAUTH COMPLETE SETUP');
console.log('='.repeat(60));
console.log('');
console.log('This tool will help you set up Google OAuth for your website.');
console.log('');
console.log('='.repeat(60));
console.log('');
console.log('📋 STEP 1: GET GOOGLE OAUTH CREDENTIALS');
console.log('');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('');
console.log('2. Create a new project or select existing one:');
console.log('   - Project name: "SkinSense" (or any name)');
console.log('   - Click "CREATE"');
console.log('');
console.log('3. Enable Google+ API:');
console.log('   - Go to "APIs & Services" → "Library"');
console.log('   - Search for "Google+ API"');
console.log('   - Click "ENABLE"');
console.log('');
console.log('4. Create OAuth 2.0 Credentials:');
console.log('   - Go to "APIs & Services" → "Credentials"');
console.log('   - Click "CREATE CREDENTIALS" → "OAuth client ID"');
console.log('   - Application type: "Web application"');
console.log('   - Name: "SkinSense Web Client"');
console.log('');
console.log('5. Configure OAuth consent screen (if asked):');
console.log('   - User Type: External');
console.log('   - App name: SkinSense');
console.log('   - User support email: your email');
console.log('   - Developer contact: your email');
console.log('   - Save and continue through all steps');
console.log('');
console.log('6. Add Authorized URIs:');
console.log('');
console.log('   Authorized JavaScript origins:');
console.log('   ┌──────────────────────────────────────┐');
console.log('   │ http://localhost:3001                │');
console.log('   └──────────────────────────────────────┘');
console.log('');
console.log('   Authorized redirect URIs:');
console.log('   ┌────────────────────────────────────────────────────────┐');
console.log('   │ http://localhost:3001/api/auth/google/callback        │');
console.log('   └────────────────────────────────────────────────────────┘');
console.log('');
console.log('7. Copy your credentials:');
console.log('   - Client ID: (looks like: xxxxx.apps.googleusercontent.com)');
console.log('   - Client Secret: (looks like: GOCSPX-xxxxx)');
console.log('');
console.log('='.repeat(60));
console.log('');

rl.question('Have you completed the steps above? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('');
    console.log('Please complete the steps above first, then run this script again.');
    console.log('');
    rl.close();
    process.exit(0);
  }

  console.log('');
  console.log('📝 STEP 2: ENTER YOUR CREDENTIALS');
  console.log('');

  rl.question('Enter your Google Client ID: ', (clientId) => {
    if (!clientId || clientId.trim() === '') {
      console.log('');
      console.log('❌ Client ID cannot be empty!');
      console.log('');
      rl.close();
      process.exit(1);
    }

    rl.question('Enter your Google Client Secret: ', (clientSecret) => {
      if (!clientSecret || clientSecret.trim() === '') {
        console.log('');
        console.log('❌ Client Secret cannot be empty!');
        console.log('');
        rl.close();
        process.exit(1);
      }

      console.log('');
      console.log('📝 Updating .env file...');
      
      // Update .env file
      const envPath = path.join(__dirname, '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Remove old Google OAuth settings
      envContent = envContent.replace(/^#?\s*GOOGLE_CLIENT_ID=.*/gm, '');
      envContent = envContent.replace(/^#?\s*GOOGLE_CLIENT_SECRET=.*/gm, '');
      envContent = envContent.replace(/^#?\s*GOOGLE_CALLBACK_URL=.*/gm, '');

      // Add new settings
      envContent += `\n# Google OAuth\nGOOGLE_CLIENT_ID=${clientId.trim()}\n`;
      envContent += `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}\n`;
      envContent += `GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback\n`;

      // Clean up empty lines
      envContent = envContent.split('\n').filter((line, index, arr) => {
        if (line.trim() === '') {
          return index === arr.length - 1 || arr[index + 1].trim() !== '';
        }
        return true;
      }).join('\n');

      fs.writeFileSync(envPath, envContent);

      console.log('✅ .env file updated!');
      console.log('');
      console.log('🧪 Testing Google OAuth configuration...');
      console.log('');

      // Test configuration
      require('dotenv').config();
      
      const testClientId = process.env.GOOGLE_CLIENT_ID;
      const testClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      console.log('Client ID:', testClientId ? `✅ ${testClientId.substring(0, 20)}...` : '❌ Not found');
      console.log('Client Secret:', testClientSecret ? `✅ ${testClientSecret.substring(0, 10)}...` : '❌ Not found');
      console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || '❌ Not found');
      console.log('');

      if (testClientId && testClientSecret) {
        console.log('='.repeat(60));
        console.log('');
        console.log('🎉 GOOGLE OAUTH IS CONFIGURED!');
        console.log('');
        console.log('🔄 Now restart your server:');
        console.log('');
        console.log('   taskkill /F /IM node.exe');
        console.log('   npm run dev');
        console.log('');
        console.log('✅ Then test it:');
        console.log('');
        console.log('   1. Go to: http://localhost:3001/login');
        console.log('   2. Click "Continue with Google"');
        console.log('   3. Sign in with any Google account');
        console.log('   4. You should be logged in!');
        console.log('');
        console.log('='.repeat(60));
        console.log('');
      } else {
        console.log('❌ Configuration failed! Please try again.');
        console.log('');
      }

      rl.close();
      process.exit(0);
    });
  });
});

