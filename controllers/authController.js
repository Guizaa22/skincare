const User = require('../models/User');
const emailService = require('../utils/emailService');
const smsService = require('../utils/smsService');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');

// Register user
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      skinType,
      skinConcerns,
      allergies,
      address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json(
        formatErrorResponse('User already exists with this email or phone number')
      );
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      skinType,
      skinConcerns,
      allergies,
      address
    });

    // Generate verification tokens
    const emailToken = user.getEmailVerificationToken();
    const phoneCode = user.getPhoneVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await emailService.sendEmailVerification(user, emailToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    // Send verification SMS
    try {
      await smsService.sendVerificationCode(user.phone, phoneCode);
    } catch (error) {
      console.error('Failed to send verification SMS:', error);
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(201)
       .cookie('token', token, cookieOptions)
       .json(formatSuccessResponse({
         user: {
           id: user._id,
           firstName: user.firstName,
           lastName: user.lastName,
           email: user.email,
           phone: user.phone,
           role: user.role,
           isEmailVerified: user.isEmailVerified,
           isPhoneVerified: user.isPhoneVerified
         },
         token
       }, 'Registration successful. Please verify your email and phone number.'));

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(formatErrorResponse('Registration failed', error.message));
  }
};

// Login user
exports.login = async (req, res) => {
  console.log('🔍 LOGIN CONTROLLER CALLED');
  console.log('📝 Request body:', req.body);
  console.log('📋 Content-Type:', req.get('Content-Type'));
  console.log('🌐 Request method:', req.method);
  
  try {
    const { email, password, rememberMe } = req.body;
    const isFormSubmission = req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded');
    
    console.log('✅ Form submission detected:', isFormSubmission);

    // Validate email and password
    if (!email || !password) {
      if (isFormSubmission) {
        return res.render('pages/login', {
          title: 'Login - SkinSense',
          error: 'Please provide email and password',
          formData: { email }
        });
      }
      return res.status(400).json(
        formatErrorResponse('Please provide email and password')
      );
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      if (isFormSubmission) {
        return res.render('pages/login', {
          title: 'Login - SkinSense',
          error: 'Invalid email or password',
          formData: { email }
        });
      }
      return res.status(401).json(
        formatErrorResponse('Invalid credentials')
      );
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      if (isFormSubmission) {
        return res.render('pages/login', {
          title: 'Login - SkinSense',
          error: 'Invalid email or password',
          formData: { email }
        });
      }
      return res.status(401).json(
        formatErrorResponse('Invalid credentials')
      );
    }

    // Check if account is active
    if (!user.isActive) {
      if (isFormSubmission) {
        return res.render('pages/login', {
          title: 'Login - SkinSense',
          error: 'Account is deactivated. Please contact support.',
          formData: { email }
        });
      }
      return res.status(401).json(
        formatErrorResponse('Account is deactivated. Please contact support.')
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Set cookie with longer expiration if "remember me" is checked
    const cookieExpireDays = rememberMe ? 30 : parseInt(process.env.JWT_COOKIE_EXPIRE);
    const cookieOptions = {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('token', token, cookieOptions);

    // Handle form submission vs API call
    if (isFormSubmission) {
      // Redirect based on user role
      const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
      return res.redirect(redirectUrl);
    }

    // API response
    res.status(200).json(formatSuccessResponse({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        avatar: user.avatar
      },
      token
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    
    const isFormSubmission = req.get('Content-Type') && req.get('Content-Type').includes('application/x-www-form-urlencoded');
    
    if (isFormSubmission) {
      return res.render('pages/login', {
        title: 'Login - SkinSense',
        error: 'Login failed. Please try again.',
        formData: { email: req.body.email }
      });
    }
    
    res.status(500).json(formatErrorResponse('Login failed', error.message));
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json(formatSuccessResponse(null, 'Logged out successfully'));
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json(formatSuccessResponse({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        skinType: user.skinType,
        skinConcerns: user.skinConcerns,
        allergies: user.allergies,
        address: user.address,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json(formatErrorResponse('Failed to get user data', error.message));
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      skinType: req.body.skinType,
      skinConcerns: req.body.skinConcerns,
      allergies: req.body.allergies,
      address: req.body.address,
      preferences: req.body.preferences
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json(formatSuccessResponse({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        skinType: user.skinType,
        skinConcerns: user.skinConcerns,
        allergies: user.allergies,
        address: user.address,
        preferences: user.preferences
      }
    }, 'Profile updated successfully'));

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(formatErrorResponse('Failed to update profile', error.message));
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json(
        formatErrorResponse('Current password is incorrect')
      );
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(formatSuccessResponse(null, 'Password changed successfully'));

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(formatErrorResponse('Failed to change password', error.message));
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(
        formatErrorResponse('Verification token is required')
      );
    }

    // Find user with matching token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(
        formatErrorResponse('Invalid or expired verification token')
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(formatSuccessResponse(null, 'Email verified successfully'));

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json(formatErrorResponse('Email verification failed', error.message));
  }
};

// Verify phone
exports.verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(
        formatErrorResponse('Verification code is required')
      );
    }

    // Find user with matching code
    const user = await User.findOne({
      _id: req.user.id,
      phoneVerificationCode: code,
      phoneVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(
        formatErrorResponse('Invalid or expired verification code')
      );
    }

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationCode = undefined;
    user.phoneVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(formatSuccessResponse(null, 'Phone number verified successfully'));

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json(formatErrorResponse('Phone verification failed', error.message));
  }
};

// Resend email verification
exports.resendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return res.status(400).json(
        formatErrorResponse('Email is already verified')
      );
    }

    // Generate new verification token
    const token = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    await emailService.sendEmailVerification(user, token);

    res.status(200).json(formatSuccessResponse(null, 'Verification email sent'));

  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json(formatErrorResponse('Failed to resend verification email', error.message));
  }
};

// Resend phone verification
exports.resendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isPhoneVerified) {
      return res.status(400).json(
        formatErrorResponse('Phone number is already verified')
      );
    }

    // Generate new verification code
    const code = user.getPhoneVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Send verification SMS
    await smsService.sendVerificationCode(user.phone, code);

    res.status(200).json(formatSuccessResponse(null, 'Verification code sent'));

  } catch (error) {
    console.error('Resend phone verification error:', error);
    res.status(500).json(formatErrorResponse('Failed to resend verification code', error.message));
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(
        formatErrorResponse('No user found with that email address')
      );
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.status(200).json(formatSuccessResponse(null, 'Password reset email sent'));

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(formatErrorResponse('Failed to process password reset request', error.message));
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with matching token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(
        formatErrorResponse('Invalid or expired reset token')
      );
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = user.getSignedJwtToken();

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(200)
       .cookie('token', jwtToken, cookieOptions)
       .json(formatSuccessResponse({
         user: {
           id: user._id,
           firstName: user.firstName,
           lastName: user.lastName,
           email: user.email,
           role: user.role
         },
         token: jwtToken
       }, 'Password reset successful'));

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json(formatErrorResponse('Password reset failed', error.message));
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json(
        formatErrorResponse('Password is incorrect')
      );
    }

    // Deactivate instead of deleting
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json(formatSuccessResponse(null, 'Account deactivated successfully'));

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json(formatErrorResponse('Failed to delete account', error.message));
  }
};

// Google OAuth - Register/Login
exports.googleAuth = async (req, res) => {
  try {
    const profile = req.user; // From passport
    const id = profile.id || profile.sub;
    const displayName = profile.displayName || profile.name || 'User';
    const emails = profile.emails || [];
    const photos = profile.photos || [];
    
    const email = emails[0] ? emails[0].value : null;
    if (!email) {
      return res.redirect('/login?error=no_email');
    }
    
    const firstName = displayName.split(' ')[0] || displayName;
    const lastName = displayName.split(' ').slice(1).join(' ') || '';
    const avatar = photos[0] ? photos[0].value : undefined;

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { googleId: id },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // User exists - update Google ID if logging in with Google for first time
      if (!user.googleId) {
        user.googleId = id;
        user.provider = 'google';
        if (avatar && !user.avatar.url) {
          user.avatar.url = avatar;
        }
        await user.save({ validateBeforeSave: false });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      // Generate JWT token
      const token = user.getSignedJwtToken();

      // Set cookie
      const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res.cookie('token', token, cookieOptions);

      // Redirect based on user role
      const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
      return res.redirect(redirectUrl);
    } else {
      // New user - create account with Google info
      user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        googleId: id,
        provider: 'google',
        isEmailVerified: true, // Google emails are verified
        avatar: avatar ? { url: avatar } : undefined,
        role: 'client'
      });

      // Generate JWT token
      const token = user.getSignedJwtToken();

      // Set cookie
      const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res.cookie('token', token, cookieOptions);

      // Redirect to dashboard
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=google_auth_failed');
  }
};

// Google OAuth failure handler
exports.googleAuthFailure = (req, res) => {
  res.redirect('/login?error=google_auth_failed');
};

module.exports = exports;
