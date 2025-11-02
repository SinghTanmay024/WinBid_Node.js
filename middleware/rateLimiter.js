const otpService = require('../services/otpService');

/**
 * Rate limiting middleware for registration endpoints
 */
class RateLimiter {
  /**
   * Middleware to check registration rate limit (per IP)
   */
  static registrationRateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimit = otpService.checkRegistrationRateLimit(ip, 5, 3600); // 5 per hour

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        resetAt: rateLimit.resetAt
      });
    }

    // Add rate limit info to request headers (optional, for frontend)
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    next();
  }

  /**
   * Middleware to check OTP request rate limit (per email)
   */
  static otpRequestRateLimit(req, res, next) {
    const { email } = req.body;

    if (!email) {
      return next(); // Let validation middleware handle missing email
    }

    const rateLimit = otpService.checkOTPRateLimit(email, 3, 600); // 3 per 10 minutes

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        resetAt: rateLimit.resetAt
      });
    }

    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    next();
  }

  /**
   * Middleware to check OTP resend rate limit (per email)
   */
  static resendOTPRateLimit(req, res, next) {
    const { email } = req.body;

    if (!email) {
      return next();
    }

    const rateLimit = otpService.checkResendRateLimit(email, 3, 600); // 3 per 10 minutes

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many resend attempts. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        resetAt: rateLimit.resetAt
      });
    }

    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    next();
  }

  /**
   * Middleware to check contact form submission rate limit (per email)
   * Uses contactService to check database for recent submissions
   * Wrapped to properly handle async errors in Express 4.x
   */
  static contactFormRateLimit(req, res, next) {
    (async () => {
      try {
        const { email } = req.body;

        if (!email) {
          return next(); // Let validation middleware handle missing email
        }

        const contactService = require('../services/contactService');
        const rateLimit = await contactService.checkSubmissionRateLimit(
          email.toLowerCase(),
          1, // 1 hour window
          5  // Max 5 submissions per hour
        );

        if (!rateLimit.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            resetAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
          });
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit.maxSubmissions - rateLimit.count));
        res.setHeader('X-RateLimit-Limit', rateLimit.maxSubmissions);

        next();
      } catch (error) {
        console.error('Contact form rate limit error:', error);
        // On error, allow the request to proceed (fail open)
        next();
      }
    })().catch(err => {
      console.error('Unhandled error in contactFormRateLimit:', err);
      next(); // Fail open on unhandled errors
    });
  }
}

module.exports = RateLimiter;

