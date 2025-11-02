const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../utils/auth');
const RateLimiter = require('../middleware/rateLimiter');
const ValidationMiddleware = require('../middleware/validation');

// Legacy registration endpoint (kept for backward compatibility)
router.post('/register', authController.register);

// New OTP-based registration endpoints
router.post(
  '/register/initiate',
  RateLimiter.registrationRateLimit,
  RateLimiter.otpRequestRateLimit,
  ValidationMiddleware.validateRegistrationInitiate(),
  ValidationMiddleware.handleValidationErrors,
  ValidationMiddleware.checkDuplicateEmailAndUsername,
  authController.registerInitiate
);

router.post(
  '/register/verify-otp',
  ValidationMiddleware.validateOTPVerification(),
  ValidationMiddleware.handleValidationErrors,
  authController.registerVerifyOTP
);

router.post(
  '/register/resend-otp',
  RateLimiter.resendOTPRateLimit,
  ValidationMiddleware.validateResendOTP(),
  ValidationMiddleware.handleValidationErrors,
  authController.registerResendOTP
);

// Login and other auth endpoints
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;