const userService = require('../services/userService');
const { bidService } = require('../services/bidService')

const userController = {
  // Register a new user
  registerUser: async (req, res) => {
    try {
      const user = await userService.saveUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getUserById: async (req, res) =>{
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found By ID' });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }

  },

  // Get user by email
  getUserByEmail: async (req, res) => {
    try {
      const user = await userService.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  getUsername: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      console.log(user)
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(200).json({ success: true, data: user.username });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      if (users.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Update user
  updateUser: async (req, res) => {
    try {
      const updatedUser = await userService.updateUser(req.params.email, req.body);
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const deleted = await userService.deleteUser(req.params.email);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  

  // Get user profile (with bids)
  getUserProfile: async (req, res) => {
    try {
      const user = await userService.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const bids = await bidService.findByUserId(user._id);
      
      // Remove sensitive data
      const userObj = user.toObject();
      delete userObj.password;
      
      res.status(200).json({ success: true, data: { user: userObj, bids } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = userController;