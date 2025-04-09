const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Make sure this path is correct


// Get all users
router.get('/', userController.getAllUsers);

// Register new user
router.post('/register', userController.registerUser);

// // Get user by email
// router.get('/:email', userController.getUserByEmail);

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