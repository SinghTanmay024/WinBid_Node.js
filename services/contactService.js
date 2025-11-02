const Contact = require('../models/Contact');

/**
 * Contact Service for handling contact form business logic
 */
class ContactService {
  /**
   * Create a new contact message
   * @param {Object} contactData - Contact form data
   * @param {string} userId - Optional user ID if user is logged in
   * @returns {Promise<Object>} Created contact message
   */
  async createContact(contactData, userId = null) {
    const contact = await Contact.create({
      firstName: contactData.firstName.trim(),
      lastName: contactData.lastName.trim(),
      email: contactData.email.trim().toLowerCase(),
      subject: contactData.subject.trim(),
      message: contactData.message.trim(),
      userId: userId || null,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return contact;
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object|null>} Contact message or null
   */
  async getContactById(contactId) {
    return await Contact.findById(contactId).populate('userId', 'username email firstName lastName');
  }

  /**
   * Get all contacts (for admin use)
   * @param {Object} filters - Optional filters (status, etc.)
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Promise<Object>} Paginated contacts
   */
  async getAllContacts(filters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const query = Contact.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email firstName lastName');

    const contacts = await query.exec();
    const total = await Contact.countDocuments(filters);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if email has submitted too many contact forms recently
   * @param {string} email - Email address
   * @param {number} hours - Time window in hours (default: 1)
   * @param {number} maxSubmissions - Maximum submissions allowed (default: 5)
   * @returns {Promise<Object>} { allowed: boolean, count: number }
   */
  async checkSubmissionRateLimit(email, hours = 1, maxSubmissions = 5) {
    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - hours);

    const count = await Contact.countDocuments({
      email: email.toLowerCase(),
      createdAt: { $gte: timeWindow }
    });

    return {
      allowed: count < maxSubmissions,
      count,
      maxSubmissions
    };
  }
}

module.exports = new ContactService();

