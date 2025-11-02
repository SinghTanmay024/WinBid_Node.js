const contactService = require('../services/contactService');
const emailService = require('../services/emailService');

/**
 * Submit contact form
 * POST /api/contact
 */
exports.submitContact = async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;
    
    // Get user ID if user is authenticated (optional)
    const userId = req.user ? req.user.id : null;

    // Create contact message
    const contact = await contactService.createContact(
      {
        firstName,
        lastName,
        email,
        subject,
        message
      },
      userId
    );

    // Send confirmation email to user (non-blocking)
    emailService.sendContactConfirmationEmail(email, firstName, subject)
      .catch(err => console.error('Contact confirmation email failed:', err));

    // Send notification email to admin (non-blocking)
    emailService.sendContactNotificationEmail(contact)
      .catch(err => console.error('Contact notification email failed:', err));

    // Success response
    res.status(201).json({
      success: true,
      message: "Your message has been received. We'll get back to you soon.",
      contactId: contact._id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input and try again',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry',
        message: 'A contact message with this information already exists'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process contact form submission. Please try again later.'
    });
  }
};

/**
 * Get contact message by ID (Admin only)
 * GET /api/contact/:id
 */
exports.getContact = async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve contact message'
    });
  }
};

/**
 * Get all contact messages (Admin only)
 * GET /api/contact
 */
exports.getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // Optional filter by status

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const result = await contactService.getAllContacts(filters, page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve contact messages'
    });
  }
};

