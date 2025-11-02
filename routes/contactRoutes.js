const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../utils/auth');
const RateLimiter = require('../middleware/rateLimiter');
const ValidationMiddleware = require('../middleware/validation');

/**
 * POST /api/contact
 * Submit contact form (public endpoint, optional authentication)
 * Rate limited: 5 submissions per email per hour
 */
router.post(
  '/',
  RateLimiter.contactFormRateLimit,
  ValidationMiddleware.validateContactForm(),
  ValidationMiddleware.handleValidationErrors,
  contactController.submitContact
);

/**
 * GET /api/contact
 * Get all contact messages (Admin only)
 */
router.get(
  '/',
  protect,
  authorize('admin'),
  contactController.getAllContacts
);

/**
 * GET /api/contact/:id
 * Get contact message by ID (Admin only)
 */
router.get(
  '/:id',
  protect,
  authorize('admin'),
  contactController.getContact
);

module.exports = router;

