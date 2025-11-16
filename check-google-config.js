// Check Google OAuth configuration
require('dotenv').config();

console.log('');
console.log('='.repeat(60));
console.log('  🔍 GOOGLE OAUTH CONFIGURATION CHECK');
console.log('='.repeat(60));
console.log('');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log('GOOGLE_CLIENT_ID exists:', !!clientId);
console.log('GOOGLE_CLIENT_ID value:', clientId ? `"${clientId}"` : 'Not set');
console.log('GOOGLE_CLIENT_ID length:', clientId ? clientId.length : 0);
console.log('');
console.log('GOOGLE_CLIENT_SECRET exists:', !!clientSecret);
console.log('GOOGLE_CLIENT_SECRET value:', clientSecret ? `"${clientSecret.substring(0, 10)}..."` : 'Not set');
console.log('GOOGLE_CLIENT_SECRET length:', clientSecret ? clientSecret.length : 0);
console.log('');

const isConfigured = clientId && 
                      clientSecret &&
                      clientId.trim() !== '' && 
                      clientSecret.trim() !== '' &&
                      clientId !== 'your_google_client_id_here';

console.log('Is Google OAuth Configured?', isConfigured ? '✅ YES' : '❌ NO');
console.log('');

if (!isConfigured) {
  console.log('✅ Google OAuth is disabled (as expected)');
  console.log('   Routes will use fallback redirects');
  console.log('');
  console.log('To enable Google OAuth:');
  console.log('   1. Get credentials from Google Cloud Console');
  console.log('   2. Run: node configure-apis.js');
  console.log('');
} else {
  console.log('⚠️  Google OAuth appears to be configured');
  console.log('   Client ID:', clientId);
  console.log('');
}

console.log('='.repeat(60));
console.log('');

