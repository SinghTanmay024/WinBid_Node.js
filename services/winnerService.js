const Winner = require('../models/Winner');

class WinnerService {
    static async createWinner(winnerData) {
        try {
            const winner = new Winner(winnerData);
            return await winner.save();
        } catch (error) {
            throw error;
        }
    }

    static async getWinnerById(winnerId) {
        try {
            return await Winner.findById(winnerId)
                .populate('product')
                .populate('user', '-password');
        } catch (error) {
            throw error;
        }
    }

    static async getAllWinners() {
        try {
            return await Winner.find()
                .populate('product')
                .populate('user', '-password');
        } catch (error) {
            throw error;
        }
    }

    static async getWinnersByUser(userId) {
        try {
            return await Winner.find({ user: userId })
                .populate('product')
                .populate('user', '-password');
        } catch (error) {
            throw error;
        }
    }

    static async getWinnersByProduct(productId) {
        try {
            return await Winner.find({ product: productId })
                .populate('product')
                .populate('user', '-password');
        } catch (error) {
            throw error;
        }
    }
}

module.exports = WinnerService;