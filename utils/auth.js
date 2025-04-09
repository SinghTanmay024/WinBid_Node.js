const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const COOKIE_EXPIRE = process.env.COOKIE_EXPIRE || 30;

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Compare passwords (for login)
const comparePasswords = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};


// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};


// Protect routes - check if user is authenticated
const protect = async (req, res, next) => {
  let token;

  // Get token from cookies
  token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};


// Check if user has specific role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  hashPassword,
  comparePasswords,
  protect,
  authorize
};