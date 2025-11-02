const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * Get user's wishlist (liked items)
 * GET /api/users/:userId/wishlist
 */
exports.getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.user.id.toString();

        // Verify user can only access their own wishlist
        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own wishlist',
                error: 'FORBIDDEN'
            });
        }

        // Get wishlist items with populated product details
        const wishlistItems = await Wishlist.find({ userId })
            .populate({
                path: 'productId',
                select: '_id name description imageUrl bidPrice currentBidCount totalBids owner createdAt'
            })
            .sort('-addedAt');

        // Extract products and filter out any items with null products (deleted products)
        const products = wishlistItems
            .filter(item => item.productId) // Remove items where product was deleted
            .map(item => item.productId);

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: 'SERVER_ERROR'
        });
    }
};

/**
 * Add product to wishlist (Like a product)
 * POST /api/users/:userId/wishlist
 */
exports.addToWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId } = req.body;
        const authenticatedUserId = req.user.id.toString();

        // Verify user can only modify their own wishlist
        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'You can only modify your own wishlist',
                error: 'FORBIDDEN'
            });
        }

        // Validate productId
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
                error: 'INVALID_REQUEST'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                error: 'PRODUCT_NOT_FOUND'
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({ userId, productId });
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Product already in wishlist',
                data: {
                    productId: productId,
                    userId: userId,
                    addedAt: existing.addedAt
                }
            });
        }

        // Add to wishlist
        const wishlistItem = await Wishlist.create({
            userId,
            productId,
            addedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: {
                productId: productId,
                userId: userId,
                addedAt: wishlistItem.addedAt
            }
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        
        // Handle duplicate key error (shouldn't happen due to check above, but safety net)
        if (error.code === 11000) {
            return res.status(200).json({
                success: true,
                message: 'Product already in wishlist',
                data: {
                    productId: req.body.productId,
                    userId: req.params.userId
                }
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: 'SERVER_ERROR'
        });
    }
};

/**
 * Remove product from wishlist (Unlike)
 * DELETE /api/users/:userId/wishlist/:productId
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const authenticatedUserId = req.user.id.toString();

        // Verify user can only modify their own wishlist
        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'You can only modify your own wishlist',
                error: 'FORBIDDEN'
            });
        }

        // Validate productId format
        if (!productId || productId.length !== 24) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                error: 'INVALID_REQUEST'
            });
        }

        // Remove from wishlist
        const deletedItem = await Wishlist.findOneAndDelete({ userId, productId });

        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in wishlist',
                error: 'NOT_FOUND'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: 'SERVER_ERROR'
        });
    }
};

/**
 * Check if product is liked
 * GET /api/users/:userId/wishlist/check/:productId
 */
exports.checkIfLiked = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const authenticatedUserId = req.user.id.toString();

        // Verify user can only check their own wishlist
        if (userId !== authenticatedUserId) {
            return res.status(403).json({
                success: false,
                message: 'You can only check your own wishlist',
                error: 'FORBIDDEN'
            });
        }

        // Validate productId format
        if (!productId || productId.length !== 24) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                error: 'INVALID_REQUEST'
            });
        }

        // Check if product is in wishlist
        const isLiked = await Wishlist.checkIfLiked(userId, productId);

        res.status(200).json({
            success: true,
            isLiked: isLiked
        });
    } catch (error) {
        console.error('Error checking wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: 'SERVER_ERROR'
        });
    }
};

