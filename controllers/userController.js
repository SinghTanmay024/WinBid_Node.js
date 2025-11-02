const userService = require('../services/userService');
const BidService = require('../services/bidService');
const Bid = require('../models/Bid');

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

      const bids = await BidService.getBidsByUser(user._id);
      
      // Remove sensitive data and ensure role is included
      const userObj = user.toObject();
      delete userObj.password;
      
      // Ensure role field is explicitly included (should already be there, but making sure)
      const userResponse = {
        id: userObj._id || userObj.id,
        username: userObj.username,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        role: userObj.role || 'user', // Explicitly include role field
        bids: userObj.bids || [],
        createdAt: userObj.createdAt,
        ...(userObj.phone && { phone: userObj.phone }),
        ...(userObj.phoneNumber && { phoneNumber: userObj.phoneNumber }),
        ...(userObj.isEmailVerified !== undefined && { isEmailVerified: userObj.isEmailVerified }),
        ...(userObj.address && { address: userObj.address }),
        ...(userObj.updatedAt && { updatedAt: userObj.updatedAt })
      };
      
      // Return in the preferred format: { user: { ... }, bids: [] }
      res.status(200).json({ 
        user: userResponse,
        bids: bids || []
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get user's bidded items (unique products with bid metadata)
  getBiddedItems: async (req, res) => {
    try {
      const { userId } = req.params;
      const authenticatedUserId = req.user.id.toString();

      // Verify user can only access their own bidded items
      if (userId !== authenticatedUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own bidded items',
          error: 'FORBIDDEN'
        });
      }

      // Get all bids for the user with populated product details
      const bids = await Bid.find({ user: userId })
        .populate({
          path: 'product',
          select: '_id name description imageUrl bidPrice currentBidCount totalBids owner createdAt'
        })
        .sort('-bidTime');

      // Group by product and get the latest/highest bid for each product
      const productMap = new Map();

      bids.forEach(bid => {
        if (!bid.product) return; // Skip if product was deleted

        const productId = bid.product._id.toString();
        
        if (!productMap.has(productId)) {
          // First bid on this product - initialize
          productMap.set(productId, {
            product: bid.product,
            amount: bid.bidAmount,
            bidTime: bid.bidTime,
            isWinning: bid.isWinningBid || false,
            bidId: bid._id
          });
        } else {
          // Update if this is a higher bid or more recent
          const existing = productMap.get(productId);
          if (bid.bidAmount > existing.amount || 
              (bid.bidAmount === existing.amount && bid.bidTime > existing.bidTime)) {
            existing.amount = bid.bidAmount;
            existing.bidTime = bid.bidTime;
            existing.isWinning = bid.isWinningBid || false;
            existing.bidId = bid._id;
          }
        }
      });

      // Convert map to array with required format
      const biddedItems = Array.from(productMap.values()).map(item => ({
        _id: item.bidId,
        product: item.product,
        amount: item.amount,
        bidTime: item.bidTime,
        isWinning: item.isWinning
      }));

      res.status(200).json({
        success: true,
        data: biddedItems
      });
    } catch (error) {
      console.error('Error fetching bidded items:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: 'SERVER_ERROR'
      });
    }
  }
};

module.exports = userController;