const WinnerService = require('../services/winnerService');

class WinnerController {
    static async createWinner(req, res) {
        try {
            const winner = await WinnerService.createWinner(req.body);
            res.status(201).json(winner);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    static async getWinner(req, res) {
        try {
            const winner = await WinnerService.getWinnerById(req.params.id);
            if (!winner) {
                return res.status(404).json({ message: 'Winner not found' });
            }
            res.json(winner);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getAllWinners(req, res) {
        try {
            const winners = await WinnerService.getAllWinners();
            res.json(winners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getWinnersByUser(req, res) {
        try {
            const winners = await WinnerService.getWinnersByUser(req.params.userId);
            res.json(winners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getWinnersByProduct(req, res) {
        try {
            const winners = await WinnerService.getWinnersByProduct(req.params.productId);
            res.json(winners);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = WinnerController;