const mongoose = require('mongoose');
const Product = require('../models/Product');
const Winner = require('../models/Winner');

const bidSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    bidAmount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0.01, 'Bid amount must be at least 0.01']
    },
    bidTime: {
        type: Date,
        default: Date.now
    },
    isWinningBid: {  // Track if this bid won
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Static Methods
bidSchema.statics.findByProductId = async function(productId) {
    return this.find({ product: productId })
        .populate('user', 'name email')
        .populate('product', 'name currentPrice')
        .sort('-bidAmount');
};

bidSchema.statics.findByUserId = async function(userId) {
    return this.find({ user: userId })
        .populate('product', 'name imageUrl endDate')
        .sort('-bidTime');
};

bidSchema.statics.getHighestBid = async function(productId) {
    return this.findOne({ product: productId })
        .sort('-bidAmount')
        .populate('user', 'name email');
};

bidSchema.statics.countBidsForProduct = async function(productId) {
    return this.countDocuments({ product: productId });
};

bidSchema.statics.userHasBidOnProduct = async function(userId, productId) {
    return this.exists({ user: userId, product: productId });
};


module.exports = mongoose.model('Bid', bidSchema);