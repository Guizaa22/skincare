# 🚀 SkinSense Quick Start Guide

## ✅ Installation Complete!

Your SkinSense website has been successfully installed. Follow these steps to get started:

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] Node.js installed (v16 or higher)
- [ ] MongoDB running (local or Atlas connection string)
- [ ] Internet connection for external services

## 🔧 Quick Setup (5 minutes)

### Step 1: Create Environment File
Copy the environment template and update with your settings:

```bash
# For Windows (PowerShell)
Copy-Item .env.example .env

# For Mac/Linux
cp .env.example .env
```

### Step 2: Configure Basic Settings
Edit the `.env` file with these minimum required settings:

```env
# Database (use local MongoDB for testing)
MONGODB_URI=mongodb://localhost:27017/skinsense

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Basic business info
BUSINESS_NAME=SkinSense
BUSINESS_EMAIL=info@skinsense.com
BUSINESS_PHONE=+1234567890
```

### Step 3: Initialize Database
Run the setup script to create sample data:

```bash
npm run setup
```

This will create:
- Sample services (facials, treatments, etc.)
- Admin user: `admin@skinsense.com` / `admin123`
- Sample client: `client@example.com` / `password123`

### Step 4: Start the Server
```bash
npm run dev
```

### Step 5: Access Your Website
Open your browser and go to: `http://localhost:3000`

## 🎯 What Works Right Now

### ✅ Immediately Available
- **Homepage** with services showcase
- **Services catalog** with filtering
- **User registration and login**
- **Basic booking system** (without payment)
- **Admin panel** for management
- **Contact forms**

### ⚙️ Requires Configuration
- **Email notifications** (need Gmail setup)
- **SMS notifications** (need Twilio account)
- **Image uploads** (need Cloudinary account)

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skinsense.com | admin123 |
| Client | client@example.com | password123 |

**⚠️ Change these passwords before going live!**

## 📱 Test the Website

1. **Homepage**: View featured services and company info
2. **Services**: Browse and filter available treatments
3. **Register**: Create a new user account
4. **Login**: Sign in with your account
5. **Booking**: Try the multi-step booking process
6. **Admin**: Login as admin to manage everything

## 🚀 Next Steps

### For Development
1. Customize the design and branding
2. Add your actual services and pricing
3. Configure email/SMS services
4. Add your business information

### For Production
1. Set up proper database (MongoDB Atlas)
2. Configure email service (Gmail with app password)
3. Set up SMS service (Twilio account)
4. Configure image uploads (Cloudinary)
5. Set strong passwords and secrets
6. Deploy to your hosting provider

## 🔧 Advanced Configuration

### Email Service Setup
1. Enable 2FA on Gmail
2. Generate app-specific password
3. Update `.env` with credentials:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

### SMS Service Setup
1. Create Twilio account
2. Get phone number and credentials
3. Update `.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Image Upload Setup
1. Create Cloudinary account
2. Get credentials from dashboard
3. Update `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Make sure MongoDB is running
- Check connection string in `.env`

**Port Already in Use**
- Change PORT in `.env` to 3001 or another available port

**Module Not Found**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then reinstall

**Services Not Showing**
- Run `npm run setup` to populate sample data
- Check database connection

## 📞 Need Help?

1. Check the main `README.md` for detailed documentation
2. Look at the sample data in `sample-data.js`
3. Review the code structure and comments
4. Test with the provided sample accounts

## 🎉 Congratulations!

Your professional skincare website is ready to use! The foundation is solid and production-ready. Now you can focus on customizing it for your specific business needs.

Happy coding! 🚀
