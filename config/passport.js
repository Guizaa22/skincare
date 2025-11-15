const passport = require('passport');
const User = require('../models/User');

// Only require GoogleStrategy if credentials are available
let GoogleStrategy = null;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID.trim() !== '' && process.env.GOOGLE_CLIENT_SECRET.trim() !== '') {
  GoogleStrategy = require('passport-google-oauth20').Strategy;
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only if credentials are provided)
if (GoogleStrategy && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.trim() !== '' && process.env.GOOGLE_CLIENT_SECRET.trim() !== '') {
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Return the profile to be handled in the controller
            return done(null, profile);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
    console.log('✅ Google OAuth configured');
  } catch (error) {
    console.log('⚠️  Google OAuth configuration error:', error.message);
  }
} else {
  console.log('⚠️  Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
  console.log('   The "Continue with Google" button will not work until credentials are added.');
}

module.exports = passport;

