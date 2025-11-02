const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create unique compound index to prevent duplicate likes
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Static Methods
wishlistSchema.statics.findByUserId = async function(userId) {
    return this.find({ userId: userId })
        .populate('productId')
        .sort('-addedAt');
};

wishlistSchema.statics.findByUserAndProduct = async function(userId, productId) {
    return this.findOne({ userId: userId, productId: productId });
};

wishlistSchema.statics.addToWishlist = async function(userId, productId) {
    try {
        // Check if already exists
        const existing = await this.findOne({ userId, productId });
        if (existing) {
            return { exists: true, item: existing };
        }
        
        // Create new wishlist item
        const wishlistItem = await this.create({
            userId,
            productId,
            addedAt: new Date()
        });
        
        return { exists: false, item: wishlistItem };
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error - already exists
            const existing = await this.findOne({ userId, productId });
            return { exists: true, item: existing };
        }
        throw error;
    }
};

wishlistSchema.statics.removeFromWishlist = async function(userId, productId) {
    return this.findOneAndDelete({ userId: userId, productId: productId });
};

wishlistSchema.statics.checkIfLiked = async function(userId, productId) {
    const item = await this.findOne({ userId: userId, productId: productId });
    return !!item;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);

