# SkinSense - Professional Skincare Website

A comprehensive, professional skincare services website built with Node.js, featuring online booking, user management, email/SMS notifications, and a beautiful responsive interface.

## 🌟 Features

### Core Functionality
- **User Authentication & Management**
  - Secure registration and login
  - Email and phone verification
  - Password reset functionality
  - User profiles with skin assessment
  - Role-based access control (Client, Staff, Admin)

- **Service Management**
  - Comprehensive service catalog
  - Service categories and filtering
  - Detailed service descriptions
  - Reviews and ratings
  - Featured and popular services

- **Online Booking System**
  - Multi-step booking process
  - Real-time availability checking
  - Automatic time slot management
  - Booking confirmation and reminders
  - Cancellation and rescheduling

- **Communication**
  - Email notifications (welcome, confirmations, reminders)
  - SMS notifications via Twilio
  - Contact form with auto-responses
  - Newsletter subscription

- **Admin Panel**
  - User management
  - Booking management
  - Service management
  - Analytics and reporting
  - Bulk email functionality

### Technical Features
- **Security**
  - JWT authentication
  - CSRF protection
  - Rate limiting
  - Input validation and sanitization
  - Helmet.js security headers

- **File Uploads**
  - Cloudinary integration
  - Image optimization
  - Avatar uploads
  - Service images
  - Before/after photos

- **Database**
  - MongoDB with Mongoose ODM
  - Comprehensive data models
  - Indexing for performance
  - Data validation

- **Frontend**
  - Responsive Bootstrap design
  - Progressive enhancement
  - Accessibility features
  - Modern CSS and JavaScript

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)
- Twilio account (for SMS notifications)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skinsense-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/skinsense

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   EMAIL_FROM=noreply@skinsense.com

   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Session Configuration
   SESSION_SECRET=your_session_secret_key
   SESSION_NAME=skinsense_session

   # Business Configuration
   BUSINESS_NAME=SkinSense
   BUSINESS_EMAIL=info@skinsense.com
   BUSINESS_PHONE=+1234567890
   BUSINESS_ADDRESS=123 Beauty Street, Skincare City, SC 12345

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # Admin Configuration
   ADMIN_EMAIL=admin@skinsense.com
   ADMIN_PASSWORD=admin123_change_in_production
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
skinsense-website/
├── config/
│   ├── database.js          # MongoDB connection configuration
│   └── cloudinary.js        # Cloudinary setup and helpers
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── bookingController.js # Booking management
│   └── userController.js    # User management
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   └── upload.js            # File upload handling
├── models/
│   ├── User.js              # User data model
│   ├── Booking.js           # Booking data model
│   └── Service.js           # Service data model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── bookings.js          # Booking routes
│   ├── services.js          # Service routes
│   └── index.js             # Main routes
├── public/
│   ├── css/
│   │   └── style.css        # Custom styles
│   ├── js/
│   │   ├── script.js        # Main JavaScript
│   │   └── booking.js       # Booking page logic
│   └── images/              # Static images
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Header template
│   │   └── footer.ejs       # Footer template
│   └── pages/
│       ├── home.ejs         # Homepage
│       ├── services.ejs     # Services page
│       ├── booking.ejs      # Booking page
│       └── admin.ejs        # Admin dashboard
├── utils/
│   ├── helpers.js           # Utility functions
│   ├── emailService.js      # Email service
│   └── smsService.js        # SMS service
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── server.js               # Main application file
└── README.md               # This file
```

## 🔧 Configuration

### Database Setup
1. **Local MongoDB**: Make sure MongoDB is running on your machine
2. **MongoDB Atlas**: Create a cluster and get the connection string
3. Update `MONGODB_URI` in your `.env` file

### Email Configuration
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use the app password in the `EMAIL_PASS` environment variable

### SMS Configuration
1. Create a Twilio account
2. Get a phone number
3. Add your credentials to the `.env` file

### Image Upload Configuration
1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Add them to your `.env` file

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/verify-phone` - Verify phone
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Booking Endpoints
- `GET /api/bookings` - Get all bookings (admin)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/reschedule` - Reschedule booking
- `GET /api/bookings/available-slots` - Get available time slots

### Service Endpoints
- `GET /api/services` - Get all services
- `GET /api/services/categories` - Get service categories
- `GET /api/services/featured` - Get featured services
- `GET /api/services/popular` - Get popular services
- `GET /api/services/:id` - Get service details
- `POST /api/services/:id/review` - Add service review

## 🔐 Security Features

- **Authentication**: JWT-based authentication with secure HTTP-only cookies
- **Authorization**: Role-based access control
- **Validation**: Comprehensive input validation using express-validator
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-site request forgery protection
- **Security Headers**: Helmet.js for secure HTTP headers
- **Password Hashing**: bcrypt for secure password storage
- **Data Sanitization**: Input sanitization and XSS protection

## 🎨 Frontend Features

- **Responsive Design**: Mobile-first Bootstrap-based design
- **Progressive Enhancement**: Works without JavaScript
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Optimized images and lazy loading
- **Modern UI**: Clean, professional interface
- **Interactive Elements**: Smooth animations and transitions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT and sessions
3. Configure production database connection
4. Set up proper CORS origins
5. Configure SSL/TLS certificates

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] SSL certificates installed
- [ ] Email/SMS services tested
- [ ] File uploads working
- [ ] Admin account created
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📋 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information
4. Contact support at support@skinsense.com

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete booking system
- User management
- Email/SMS notifications
- Admin panel
- Responsive design

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Payment integration (Stripe/PayPal)
- [ ] Loyalty program
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] AI skin analysis
- [ ] Appointment reminders via push notifications
- [ ] Social media integration
- [ ] Customer feedback system
- [ ] Inventory management

## 🙏 Acknowledgments

- Bootstrap for the responsive framework
- Express.js for the robust backend
- MongoDB for flexible data storage
- Cloudinary for image management
- Twilio for SMS services
- All the open-source contributors

---

Built with ❤️ for beautiful, healthy skin.

For more information, visit [SkinSense Website](http://localhost:3000)
