// Configure Google OAuth and Twilio SMS
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('');
console.log('='.repeat(60));
console.log('  🔧 API CONFIGURATION');
console.log('='.repeat(60));
console.log('');
console.log('Let\'s configure Google OAuth and Twilio SMS');
console.log('You can skip any service by pressing Enter');
console.log('');
console.log('='.repeat(60));
console.log('');

async function configure() {
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  return new Promise((resolve) => {
    console.log('📧 GOOGLE OAUTH CONFIGURATION');
    console.log('');
    console.log('To get Google OAuth credentials:');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable Google+ API');
    console.log('4. Credentials → Create Credentials → OAuth 2.0 Client');
    console.log('5. Application type: Web application');
    console.log('6. Authorized redirect URIs:');
    console.log('   http://localhost:3001/api/auth/google/callback');
    console.log('');
    
    rl.question('Enter Google Client ID (or press Enter to skip): ', (clientId) => {
      if (clientId.trim()) {
        rl.question('Enter Google Client Secret: ', (clientSecret) => {
          // Update .env
          if (envContent.includes('GOOGLE_CLIENT_ID=')) {
            envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID=${clientId.trim()}`);
          } else {
            envContent += `\nGOOGLE_CLIENT_ID=${clientId.trim()}\n`;
          }

          if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
            envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}`);
          } else {
            envContent += `GOOGLE_CLIENT_SECRET=${clientSecret.trim()}\n`;
          }

          if (!envContent.includes('GOOGLE_CALLBACK_URL=')) {
            envContent += `GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback\n`;
          }

          console.log('✅ Google OAuth configured!');
          console.log('');
          
          configureTwilio();
        });
      } else {
        console.log('⏭️  Skipped Google OAuth');
        console.log('');
        configureTwilio();
      }
    });

    function configureTwilio() {
      console.log('📱 TWILIO SMS CONFIGURATION');
      console.log('');
      console.log('To get Twilio credentials:');
      console.log('1. Go to: https://www.twilio.com/');
      console.log('2. Sign up for free trial');
      console.log('3. Get a phone number');
      console.log('4. Copy Account SID and Auth Token from dashboard');
      console.log('');
      
      rl.question('Enter Twilio Account SID (or press Enter to skip): ', (accountSid) => {
        if (accountSid.trim()) {
          rl.question('Enter Twilio Auth Token: ', (authToken) => {
            rl.question('Enter Twilio Phone Number (e.g., +1234567890): ', (phoneNumber) => {
              // Update .env
              if (envContent.includes('TWILIO_ACCOUNT_SID=')) {
                envContent = envContent.replace(/TWILIO_ACCOUNT_SID=.*/g, `TWILIO_ACCOUNT_SID=${accountSid.trim()}`);
              } else {
                envContent += `\nTWILIO_ACCOUNT_SID=${accountSid.trim()}\n`;
              }

              if (envContent.includes('TWILIO_AUTH_TOKEN=')) {
                envContent = envContent.replace(/TWILIO_AUTH_TOKEN=.*/g, `TWILIO_AUTH_TOKEN=${authToken.trim()}`);
              } else {
                envContent += `TWILIO_AUTH_TOKEN=${authToken.trim()}\n`;
              }

              if (envContent.includes('TWILIO_PHONE_NUMBER=')) {
                envContent = envContent.replace(/TWILIO_PHONE_NUMBER=.*/g, `TWILIO_PHONE_NUMBER=${phoneNumber.trim()}`);
              } else {
                envContent += `TWILIO_PHONE_NUMBER=${phoneNumber.trim()}\n`;
              }

              console.log('✅ Twilio SMS configured!');
              console.log('');
              
              saveAndFinish();
            });
          });
        } else {
          console.log('⏭️  Skipped Twilio SMS');
          console.log('');
          saveAndFinish();
        }
      });
    }

    function saveAndFinish() {
      // Clean up empty lines
      envContent = envContent.split('\n').filter(line => line.trim() !== '').join('\n') + '\n';

      // Save .env file
      fs.writeFileSync(envPath, envContent);

      console.log('='.repeat(60));
      console.log('');
      console.log('✅ Configuration saved!');
      console.log('');
      console.log('📋 Summary:');
      console.log(`   Google OAuth: ${envContent.includes('GOOGLE_CLIENT_ID=') && !envContent.includes('GOOGLE_CLIENT_ID=""') ? '✅ Configured' : '⏭️  Not configured'}`);
      console.log(`   Twilio SMS: ${envContent.includes('TWILIO_ACCOUNT_SID=') && !envContent.includes('TWILIO_ACCOUNT_SID=""') ? '✅ Configured' : '⏭️  Not configured'}`);
      console.log('');
      console.log('🔄 Restart your server to apply changes:');
      console.log('   taskkill /F /IM node.exe');
      console.log('   npm run dev');
      console.log('');
      console.log('='.repeat(60));
      console.log('');

      rl.close();
      resolve();
    }
  });
}

configure().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

