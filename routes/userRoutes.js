const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Make sure this path is correct
const { protect } = require('../utils/auth');


// Get all users
router.get('/', userController.getAllUsers);

// Get user profile (requires authentication) - Must be before /:id route
router.get('/profile', protect, userController.getUserProfile);

// Register new user
router.post('/register', userController.registerUser);

// // Get user by email
// router.get('/:email', userController.getUserByEmail);

// Get user's bidded items (requires authentication) - Must be before /:id route
router.get('/:userId/bids', protect, userController.getBiddedItems);

// Get user by Id
router.get('/:id', userController.getUserById);

// Update user
router.put('/:email', userController.updateUser);

// Delete user
router.delete('/:email', userController.deleteUser);

// GetRole
// router.get('/:id', userController.getRole);

// get username
router.get('/id/:id', userController.getUsername);

module.exports = router;