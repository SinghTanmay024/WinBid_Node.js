const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service for sending OTP and other transactional emails
 */
class EmailService {
  constructor() {
    // Initialize transporter based on environment
    // For development, use Ethereal or Gmail
    // For production, use SendGrid, AWS SES, Mailgun, etc.
    this.transporter = null;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@winbid.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'WinBid';
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid uses nodemailer-sendgrid-transport or direct API
      // For simplicity, we'll use SMTP if configured
      this.transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    // Check if using AWS SES
    else if (process.env.AWS_SES_REGION && process.env.AWS_ACCESS_KEY_ID) {
      this.transporter = nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_ACCESS_KEY_ID,
          pass: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    }
    // Check if using Gmail
    else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    }
    // Default: Use SMTP configuration
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    // Development: Use Ethereal (creates test account)
    else {
      // In development, create a test account or use console logging
      console.warn('No email configuration found. Emails will be logged to console.');
      this.transporter = {
        sendMail: async (options) => {
          console.log('\n=== EMAIL (Development Mode) ===');
          console.log('To:', options.to);
          console.log('Subject:', options.subject);
          console.log('Body:', options.html || options.text);
          console.log('===============================\n');
          return { messageId: 'dev-' + Date.now() };
        }
      };
    }
  }

  /**
   * Send OTP email for registration
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP code
   * @param {string} firstName - User's first name
   */
  async sendOTPEmail(email, otp, firstName = 'User') {
    const subject = 'Your WinBid Registration Code';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">Welcome to WinBid!</h1>
            
            <p>Hi ${firstName},</p>
            
            <p>Thank you for registering with WinBid. Please use the following verification code to complete your registration:</p>
            
            <div style="background-color: #ffffff; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h2 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
            </div>
            
            <p style="color: #dc3545; font-weight: bold;">⚠️ Security Notice:</p>
            <ul>
              <li>This code will expire in <strong>5 minutes</strong></li>
              <li>Never share this code with anyone</li>
              <li>WinBid will never ask for your verification code via phone or email</li>
            </ul>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              © ${new Date().getFullYear()} WinBid. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to WinBid!
      
      Hi ${firstName},
      
      Thank you for registering with WinBid. Please use the following verification code to complete your registration:
      
      Verification Code: ${otp}
      
      ⚠️ Security Notice:
      - This code will expire in 5 minutes
      - Never share this code with anyone
      - WinBid will never ask for your verification code via phone or email
      
      If you didn't request this code, please ignore this email.
      
      © ${new Date().getFullYear()} WinBid. All rights reserved.
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: subject,
        html: html,
        text: text
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  /**
   * Send welcome email after successful registration
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} username - User's username
   */
  async sendWelcomeEmail(email, firstName, username) {
    const subject = 'Welcome to WinBid!';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">🎉 Welcome to WinBid!</h1>
            
            <p>Hi ${firstName},</p>
            
            <p>Congratulations! Your account has been successfully created.</p>
            
            <div style="background-color: #ffffff; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Account Details:</strong></p>
              <p style="margin: 5px 0;">Email: ${email}</p>
              <p style="margin: 5px 0;">Username: ${username}</p>
              <p style="margin: 5px 0;">Status: ✅ Email Verified</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Explore exciting auctions and start bidding</li>
              <li>Set up your profile to personalize your experience</li>
              <li>Browse featured products and deals</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://winbid.com'}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
              </a>
            </div>
            
            <p>If you have any questions, our support team is here to help.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              Thank you for joining WinBid!
            </p>
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              © ${new Date().getFullYear()} WinBid. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      🎉 Welcome to WinBid!
      
      Hi ${firstName},
      
      Congratulations! Your account has been successfully created.
      
      Account Details:
      - Email: ${email}
      - Username: ${username}
      - Status: ✅ Email Verified
      
      What's Next?
      - Explore exciting auctions and start bidding
      - Set up your profile to personalize your experience
      - Browse featured products and deals
      
      Visit ${process.env.FRONTEND_URL || 'https://winbid.com'} to get started.
      
      If you have any questions, our support team is here to help.
      
      Thank you for joining WinBid!
      
      © ${new Date().getFullYear()} WinBid. All rights reserved.
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: subject,
        html: html,
        text: text
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email - it's not critical
      console.warn('Welcome email failed, but user registration was successful');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send confirmation email to user after contact form submission
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name
   * @param {string} subject - Contact form subject
   */
  async sendContactConfirmationEmail(email, firstName = 'User', subject = 'Your Inquiry') {
    const emailSubject = 'Thank You for Contacting WinBid';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">Thank You for Contacting Us!</h1>
            
            <p>Hi ${firstName},</p>
            
            <p>Thank you for reaching out to WinBid. We have received your message regarding:</p>
            
            <div style="background-color: #ffffff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Subject: ${this.escapeHtml(subject)}</p>
            </div>
            
            <p>Our team will review your inquiry and get back to you as soon as possible. We typically respond within 24-48 hours.</p>
            
            <p>In the meantime, feel free to explore our platform and discover exciting auction opportunities!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://winbid.com'}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visit WinBid
              </a>
            </div>
            
            <p>If you have any urgent questions, please don't hesitate to contact our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated confirmation. Please do not reply to this email.
            </p>
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              © ${new Date().getFullYear()} WinBid. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Thank You for Contacting Us!
      
      Hi ${firstName},
      
      Thank you for reaching out to WinBid. We have received your message regarding:
      
      Subject: ${subject}
      
      Our team will review your inquiry and get back to you as soon as possible. We typically respond within 24-48 hours.
      
      In the meantime, feel free to explore our platform and discover exciting auction opportunities!
      
      Visit ${process.env.FRONTEND_URL || 'https://winbid.com'} to get started.
      
      If you have any urgent questions, please don't hesitate to contact our support team.
      
      © ${new Date().getFullYear()} WinBid. All rights reserved.
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: emailSubject,
        html: html,
        text: text
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending contact confirmation email:', error);
      throw new Error('Failed to send contact confirmation email');
    }
  }

  /**
   * Send notification email to admin/support team about new contact form submission
   * @param {Object} contact - Contact message object
   */
  async sendContactNotificationEmail(contact) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@winbid.com';
    const emailSubject = `New Contact Form Submission: ${contact.subject}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #dc3545; text-align: center; margin-bottom: 30px;">🔔 New Contact Form Submission</h1>
            
            <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Contact Information</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; width: 120px;">Name:</td>
                  <td style="padding: 8px;">${this.escapeHtml(contact.firstName)} ${this.escapeHtml(contact.lastName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Email:</td>
                  <td style="padding: 8px;"><a href="mailto:${contact.email}">${this.escapeHtml(contact.email)}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Subject:</td>
                  <td style="padding: 8px;">${this.escapeHtml(contact.subject)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Submitted:</td>
                  <td style="padding: 8px;">${new Date(contact.createdAt).toLocaleString()}</td>
                </tr>
                ${contact.userId ? `
                <tr>
                  <td style="padding: 8px; font-weight: bold;">User ID:</td>
                  <td style="padding: 8px;">${contact.userId}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Message</h2>
              <p style="white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(contact.message)}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                Contact ID: ${contact._id}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666; text-align: center;">
              This is an automated notification from WinBid Contact Form.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
      🔔 New Contact Form Submission
      
      Contact Information:
      Name: ${contact.firstName} ${contact.lastName}
      Email: ${contact.email}
      Subject: ${contact.subject}
      Submitted: ${new Date(contact.createdAt).toLocaleString()}
      ${contact.userId ? `User ID: ${contact.userId}\n` : ''}
      
      Message:
      ${contact.message}
      
      Contact ID: ${contact._id}
      
      This is an automated notification from WinBid Contact Form.
    `;

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: adminEmail,
        subject: emailSubject,
        html: html,
        text: text,
        replyTo: contact.email // Set reply-to to contact's email for easy replies
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending contact notification email:', error);
      throw new Error('Failed to send contact notification email');
    }
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = new EmailService();

