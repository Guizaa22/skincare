// Quick script to create .env file
const fs = require('fs');
const path = require('path');

const envContent = `# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=development
PORT=3001

# ==========================================
# POSTGRESQL DATABASE
# ==========================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=skinsense
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# ==========================================
# JWT CONFIGURATION
# ==========================================
JWT_SECRET=skinsense_jwt_secret_key_2024_change_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# ==========================================
# SESSION CONFIGURATION
# ==========================================
SESSION_SECRET=skinsense_session_secret_2024_change_in_production
SESSION_NAME=skinsense_session

# ==========================================
# FRONTEND URL
# ==========================================
FRONTEND_URL=http://localhost:3001

# ==========================================
# CLOUDINARY (Optional - can skip for now)
# ==========================================
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ==========================================
# EMAIL (Optional - can skip for now)
# ==========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@skinsense.com

# ==========================================
# TWILIO SMS (Optional - can skip for now)
# ==========================================
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# ==========================================
# GOOGLE OAUTH (Optional - can skip for now)
# ==========================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# ==========================================
# MONGODB (Keep for migration)
# ==========================================
MONGODB_URI=mongodb://localhost:27017/skinsense

# ==========================================
# BUSINESS INFO
# ==========================================
BUSINESS_NAME=SkinSense
BUSINESS_EMAIL=info@skinsense.com
BUSINESS_PHONE=+1234567890

# ==========================================
# ADMIN
# ==========================================
ADMIN_EMAIL=admin@skinsense.com
ADMIN_PASSWORD=admin123
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env file created successfully!');
  console.log('📝 Location:', envPath);
  console.log('');
  console.log('⚠️  IMPORTANT: Update POSTGRES_PASSWORD with your actual PostgreSQL password!');
  console.log('');
  console.log('🚀 Now run: npm run dev');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}

