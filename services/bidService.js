const Bid = require('../models/Bid');
const Product = require('../models/Product');
const Winner = require('../models/Winner');
const Wishlist = require('../models/Wishlist');

class BidService {
    
    static async createBid(bidData) {
        return await Bid.create(bidData);
    }

    static async getHighestBid(productId) {
        return await Bid.findOne({ product: productId })
            .sort('-bidAmount')
            .limit(1);
    }

    static async getBidsForProduct(productId) {
        return await Bid.findByProductId(productId);
    }

    static async processBid(bidId) {
        const bid = await Bid.findById(bidId);
        if (!bid) throw new Error('Bid not found');

        const product = await Product.findById(bid.product);
        if (!product) throw new Error('Product not found');

        // Remove product from user's wishlist if it exists
        let wishlistRemoved = false;
        try {
            const deletedWishlistItem = await Wishlist.findOneAndDelete({
                userId: bid.user,
                productId: bid.product
            });
            wishlistRemoved = !!deletedWishlistItem;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            // Don't fail the bid creation if wishlist removal fails
        }

        // Increment the bid count
        product.currentBidCount += 1;
        
        // Check if bidding is complete
        if (product.currentBidCount >= product.totalBids && !product.isClosed) {
            product.isClosed = true;
            
            // Get all bids for this product
            const bids = await Bid.find({ product: product._id });
            
            // Select a random winner from all bidders
            const randomIndex = Math.floor(Math.random() * bids.length);
            const winningBid = bids[randomIndex];
            
            // Mark the winning bid
            winningBid.isWinningBid = true;
            await winningBid.save();
            
            // Update product with winner
            product.winner = winningBid.user;
            await product.save();
            
            // Create winner record
            const winner = await Winner.create({
                product: product._id,
                user: winningBid.user,
                winningBidAmount: winningBid.bidAmount
            });

            return { 
                product, 
                winner,
                isBiddingComplete: true,
                wishlistRemoved 
            };
        } else {
            await product.save();
            return { 
                product, 
                isBiddingComplete: false,
                wishlistRemoved 
            };
        }
    }

    static async getBidById(bidId) {
        try {
            return await Bid.findById(bidId)
                .populate('user', '-password')
                .populate('product');
        } catch (error) {
            throw error;
        }
    }

    static async getBidsByUser(userId) {
        try {
            return await Bid.findByUserId(userId);
        } catch (error) {
            throw error;
        }
    }

    static async getHighestBid(productId) {
        try {
            return await Bid.getHighestBid(productId);
        } catch (error) {
            throw error;
        }
    }

    static async countBids(productId) {
        try {
            return await Bid.countBidsForProduct(productId);
        } catch (error) {
            throw error;
        }
    }

    static async userHasBid(userId, productId) {
        try {
            return await Bid.userHasBidOnProduct(userId, productId);
        } catch (error) {
            throw error;
        }
    }

    static async deleteBid(bidId) {
        try {
            return await Bid.findByIdAndDelete(bidId);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BidService;