const express = require('express');
const router = express.Router();
const BidController = require('../controllers/bidController');

// Bid CRUD operations
router.post('/', BidController.placeBid);
router.get('/product/:productId', BidController.getBidsForProduct);
router.get('/:id', BidController.getBid);
router.delete('/:id', BidController.deleteBid);

// Product-specific bids
router.get('/product/:productId', BidController.getProductBids);
router.get('/product/:productId/highest', BidController.getHighestBid);

// User-specific bids
router.get('/user/:userId', BidController.getUserBids);

module.exports = router;