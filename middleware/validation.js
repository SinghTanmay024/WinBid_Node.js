const { body, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Validation middleware for registration
 */
class ValidationMiddleware {
  /**
   * Validate registration initiate request
   */
  static validateRegistrationInitiate() {
    return [
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
      body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be between 1 and 100 characters'),
      body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be between 1 and 100 characters'),
      body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
      body('phoneNumber')
        .optional()
        .trim()
        .matches(/^\+?[\d\s\-\(\)]{7,}$/)
        .withMessage('Please provide a valid phone number'),
    ];
  }

  /**
   * Validate OTP verification request
   */
  static validateOTPVerification() {
    return [
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
      body('registrationToken')
        .trim()
        .notEmpty()
        .withMessage('Registration token is required')
        .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        .withMessage('Invalid registration token format'),
    ];
  }

  /**
   * Validate resend OTP request
   */
  static validateResendOTP() {
    return [
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      body('registrationToken')
        .trim()
        .notEmpty()
        .withMessage('Registration token is required')
        .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        .withMessage('Invalid registration token format'),
    ];
  }

  /**
   * Handle validation errors
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = {};
      errors.array().forEach(error => {
        errorMessages[error.param] = error.msg;
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    next();
  }

  /**
   * Check if email already exists
   */
  static async checkEmailExists(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
          error: 'DUPLICATE_ENTRY',
          errors: {
            email: 'Email is already registered'
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking email existence:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Check if username already exists
   */
  static async checkUsernameExists(req, res, next) {
    try {
      const { username } = req.body;
      const user = await User.findOne({ username: username.trim() });
      
      if (user) {
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
          error: 'DUPLICATE_ENTRY',
          errors: {
            username: 'Username already exists'
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking username existence:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Check both email and username exist (for initiate endpoint)
   */
  static async checkDuplicateEmailAndUsername(req, res, next) {
    try {
      const { email, username } = req.body;
      const errors = {};

      // Check email
      const emailUser = await User.findOne({ email: email.toLowerCase() });
      if (emailUser) {
        errors.email = 'Email is already registered';
      }

      // Check username
      const usernameUser = await User.findOne({ username: username.trim() });
      if (usernameUser) {
        errors.username = 'Username already exists';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email or username already exists',
          error: 'DUPLICATE_ENTRY',
          errors
        });
      }

      next();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Validate contact form submission
   */
  static validateContactForm() {
    return [
      body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
      body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
      body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Subject must be between 1 and 200 characters'),
      body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters')
    ];
  }
}

module.exports = ValidationMiddleware;

