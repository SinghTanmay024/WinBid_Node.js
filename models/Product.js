const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
    },
    totalBids: {
        type: Number,
        required: [true, 'Total bids count is required'],
        min: [0, 'Total bids cannot be negative']
    },
    currentBidCount: { 
        type: Number,
        default: 0
    },
    bidPrice: {
        type: Number,
        required: [true, 'Bid price is required'],
        min: [0, 'Bid price must be at least 0.01']
    },
    winner: {  // Add winner reference
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isClosed: {  // Add this to mark if bidding is complete
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);