const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    winDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    winningBidAmount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Winner', winnerSchema);