const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../utils/auth');

// All wishlist routes require authentication
router.use(protect);

// Get user's wishlist (liked items)
router.get('/:userId/wishlist', wishlistController.getWishlist);

// Check if product is liked
router.get('/:userId/wishlist/check/:productId', wishlistController.checkIfLiked);

// Add product to wishlist (Like)
router.post('/:userId/wishlist', wishlistController.addToWishlist);

// Remove product from wishlist (Unlike)
router.delete('/:userId/wishlist/:productId', wishlistController.removeFromWishlist);

module.exports = router;

