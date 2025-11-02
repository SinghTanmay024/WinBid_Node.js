const User = require("../models/User");
const { generateToken } = require("../utils/auth");
const bcrypt = require("bcryptjs");
const otpService = require("../services/otpService");
const emailService = require("../services/emailService");
const { hashPassword } = require("../utils/auth");

exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    // Create user (password will be hashed in the pre-save hook)
    const user = await User.create({
      username,
      email,
      password, // This will be hashed by the pre-save hook
      firstName,
      lastName,
    });

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select("password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email not found",
      });
    }

    // Check if password matches
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Send response without password
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Initiate Registration (Step 1)
 * Validates user data, checks for duplicates, and sends OTP to email
 */
exports.registerInitiate = async (req, res) => {
  try {
    const { email, password, firstName, lastName, username, phoneNumber } = req.body;

    // Hash password before storing temporarily
    const passwordHash = await hashPassword(password);

    // Generate OTP
    const otp = otpService.generateOTP();
    const otpHash = await otpService.hashOTP(otp);

    // Generate registration token
    const registrationToken = otpService.generateRegistrationToken();

    // Store registration data temporarily (5 minutes TTL)
    otpService.storeRegistrationData(registrationToken, {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      username: username.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      otpHash,
      verificationAttempts: 0
    }, 300); // 5 minutes

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, otp, firstName);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Delete registration data if email fails
      otpService.deleteRegistrationData(registrationToken);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: 'INTERNAL_ERROR'
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      registrationToken,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Registration initiate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Verify OTP (Step 2)
 * Verifies the OTP and completes user registration
 */
exports.registerVerifyOTP = async (req, res) => {
  try {
    const { email, otp, registrationToken } = req.body;

    // Get registration data
    const registrationData = otpService.getRegistrationData(registrationToken);

    if (!registrationData) {
      return res.status(404).json({
        success: false,
        message: 'Registration session expired. Please start again.',
        error: 'SESSION_EXPIRED'
      });
    }

    // Verify email matches
    if (registrationData.email !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match registration session',
        error: 'INVALID_EMAIL'
      });
    }

    // Check verification rate limit
    const rateLimit = otpService.checkVerificationRateLimit(registrationToken, 5);
    if (!rateLimit.allowed) {
      otpService.incrementVerificationAttempts(registrationToken);
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Verify OTP
    const isOTPValid = await otpService.verifyOTP(otp, registrationData.otpHash);

    if (!isOTPValid) {
      otpService.incrementVerificationAttempts(registrationToken);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        error: 'INVALID_OTP'
      });
    }

    // OTP is valid - create user account
    try {
      const user = await User.create({
        email: registrationData.email,
        username: registrationData.username,
        password: registrationData.passwordHash, // Already hashed
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phoneNumber: registrationData.phoneNumber,
        phone: registrationData.phoneNumber, // Also set phone field for compatibility
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true
      });

      // Generate JWT token
      const token = generateToken(user);

      // Delete temporary registration data
      otpService.deleteRegistrationData(registrationToken);

      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(user.email, user.firstName, user.username)
        .catch(err => console.error('Welcome email failed:', err));

      // Set cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Success response
      res.status(200).json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        },
        token
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      
      // Handle duplicate key errors
      if (dbError.code === 11000) {
        const field = Object.keys(dbError.keyPattern)[0];
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
          error: 'DUPLICATE_ENTRY',
          errors: {
            [field]: `${field} already exists`
          }
        });
      }

      throw dbError;
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Resend OTP
 * Resends OTP to user's email if not received or expired
 */
exports.registerResendOTP = async (req, res) => {
  try {
    const { email, registrationToken } = req.body;

    // Get registration data
    const registrationData = otpService.getRegistrationData(registrationToken);

    if (!registrationData) {
      return res.status(404).json({
        success: false,
        message: 'Registration session expired. Please start again.',
        error: 'SESSION_EXPIRED'
      });
    }

    // Verify email matches
    if (registrationData.email !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match registration session',
        error: 'INVALID_EMAIL'
      });
    }

    // Generate new OTP
    const otp = otpService.generateOTP();
    const otpHash = await otpService.hashOTP(otp);

    // Update registration data with new OTP
    registrationData.otpHash = otpHash;
    registrationData.verificationAttempts = 0; // Reset verification attempts
    registrationData.expiresAt = Date.now() + (300 * 1000); // Reset expiration (5 minutes)
    
    // Update in cache
    const cache = otpService.getRegistrationCache();
    cache.set(registrationToken, registrationData);

    // Send new OTP email
    try {
      await emailService.sendOTPEmail(email, otp, registrationData.firstName);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: 'INTERNAL_ERROR'
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
};
