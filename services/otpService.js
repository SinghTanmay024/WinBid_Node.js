const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * OTP Service for generating, storing, and validating OTPs
 * Uses in-memory cache with TTL (Time To Live)
 */
class OTPService {
  constructor() {
    // In-memory storage: Map<registrationToken, registrationData>
    this.registrationCache = new Map();
    
    // Rate limiting: Map<email, rateLimitData>
    this.rateLimitCache = new Map();
    
    // Cleanup interval: Remove expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Run every minute
  }

  /**
   * Generate a secure 6-digit OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    // Generate cryptographically secure random number
    const randomBytes = crypto.randomBytes(3);
    const otp = (parseInt(randomBytes.toString('hex'), 16) % 1000000)
      .toString()
      .padStart(6, '0');
    return otp;
  }

  /**
   * Hash OTP for secure storage
   * @param {string} otp - Plain text OTP
   * @returns {Promise<string>} Hashed OTP
   */
  async hashOTP(otp) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
  }

  /**
   * Verify OTP against hashed OTP
   * @param {string} otp - Plain text OTP
   * @param {string} hashedOTP - Hashed OTP
   * @returns {Promise<boolean>} True if OTP matches
   */
  async verifyOTP(otp, hashedOTP) {
    return await bcrypt.compare(otp, hashedOTP);
  }

  /**
   * Generate UUID v4 registration token
   * @returns {string} Registration token
   */
  generateRegistrationToken() {
    return crypto.randomUUID();
  }

  /**
   * Store registration data temporarily
   * @param {string} registrationToken - Registration token
   * @param {Object} registrationData - Registration data
   * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
   */
  storeRegistrationData(registrationToken, registrationData, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.registrationCache.set(registrationToken, {
      ...registrationData,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Get registration data by token
   * @param {string} registrationToken - Registration token
   * @returns {Object|null} Registration data or null if not found/expired
   */
  getRegistrationData(registrationToken) {
    const data = this.registrationCache.get(registrationToken);
    
    if (!data) {
      return null;
    }

    // Check if expired
    if (Date.now() > data.expiresAt) {
      this.registrationCache.delete(registrationToken);
      return null;
    }

    return data;
  }

  /**
   * Delete registration data
   * @param {string} registrationToken - Registration token
   */
  deleteRegistrationData(registrationToken) {
    this.registrationCache.delete(registrationToken);
  }

  /**
   * Check rate limit for OTP requests
   * @param {string} email - User email
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  checkOTPRateLimit(email, maxRequests = 3, windowSeconds = 600) {
    const key = `otp:${email}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let rateLimitData = this.rateLimitCache.get(key);

    if (!rateLimitData || now > rateLimitData.expiresAt) {
      // Create new rate limit window
      rateLimitData = {
        count: 0,
        expiresAt: now + windowMs,
        createdAt: now
      };
    }

    rateLimitData.count++;
    this.rateLimitCache.set(key, rateLimitData);

    const remaining = Math.max(0, maxRequests - rateLimitData.count);
    const allowed = rateLimitData.count <= maxRequests;

    return {
      allowed,
      remaining,
      resetAt: new Date(rateLimitData.expiresAt)
    };
  }

  /**
   * Check rate limit for registration attempts (per IP)
   * @param {string} ip - IP address
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  checkRegistrationRateLimit(ip, maxRequests = 5, windowSeconds = 3600) {
    const key = `registration:${ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let rateLimitData = this.rateLimitCache.get(key);

    if (!rateLimitData || now > rateLimitData.expiresAt) {
      rateLimitData = {
        count: 0,
        expiresAt: now + windowMs,
        createdAt: now
      };
    }

    rateLimitData.count++;
    this.rateLimitCache.set(key, rateLimitData);

    const remaining = Math.max(0, maxRequests - rateLimitData.count);
    const allowed = rateLimitData.count <= maxRequests;

    return {
      allowed,
      remaining,
      resetAt: new Date(rateLimitData.expiresAt)
    };
  }

  /**
   * Check rate limit for OTP verification attempts
   * @param {string} registrationToken - Registration token
   * @param {number} maxAttempts - Maximum attempts allowed
   * @returns {Object} { allowed: boolean, remaining: number, attempts: number }
   */
  checkVerificationRateLimit(registrationToken, maxAttempts = 5) {
    const data = this.getRegistrationData(registrationToken);
    
    if (!data) {
      return { allowed: false, remaining: 0, attempts: maxAttempts };
    }

    const attempts = data.verificationAttempts || 0;
    const remaining = Math.max(0, maxAttempts - attempts);
    const allowed = attempts < maxAttempts;

    return {
      allowed,
      remaining,
      attempts
    };
  }

  /**
   * Increment verification attempts
   * @param {string} registrationToken - Registration token
   */
  incrementVerificationAttempts(registrationToken) {
    const data = this.getRegistrationData(registrationToken);
    if (data) {
      data.verificationAttempts = (data.verificationAttempts || 0) + 1;
      this.registrationCache.set(registrationToken, data);
    }
  }

  /**
   * Check rate limit for OTP resend
   * @param {string} email - User email
   * @param {number} maxResends - Maximum resends allowed
   * @param {number} windowSeconds - Time window in seconds
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  checkResendRateLimit(email, maxResends = 3, windowSeconds = 600) {
    return this.checkOTPRateLimit(email, maxResends, windowSeconds);
  }

  /**
   * Cleanup expired entries from cache
   */
  cleanupExpiredEntries() {
    const now = Date.now();

    // Cleanup registration cache
    for (const [token, data] of this.registrationCache.entries()) {
      if (now > data.expiresAt) {
        this.registrationCache.delete(token);
      }
    }

    // Cleanup rate limit cache
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (now > data.expiresAt) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  /**
   * Get registration cache (for direct access if needed)
   */
  getRegistrationCache() {
    return this.registrationCache;
  }

  /**
   * Stop cleanup interval (for testing or shutdown)
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = new OTPService();

