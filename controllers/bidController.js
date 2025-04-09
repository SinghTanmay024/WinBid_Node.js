const BidService = require('../services/bidService');

class BidController {
    static placeBid = (async (req, res, next) => {
        const bidData = {
            ...req.body,
        };
        
        // Validate bid data
        if (!bidData.product || !bidData.bidAmount) {
            return next(new Error('Please provide product and bid amount', 400));
        }

        // Check if bid amount is valid
        const highestBid = await BidService.getHighestBid(bidData.product);
        // if (highestBid && bidData.bidAmount <= highestBid.bidAmount) {
        //     return next(new Error(
        //         `Bid must be higher than current highest bid (${highestBid.bidAmount})`, 
        //         400
        //     ));
        // }

        const bid = await BidService.createBid(bidData);
        
        // Process the bid (check if bidding is complete, select winner if needed)
        const result = await BidService.processBid(bid._id);

        res.status(201).json({
            status: 'success',
            data: {
                bid,
                ...result
            }
        });
    });

    static getBidsForProduct = (async (req, res, next) => {
        const bids = await BidService.getBidsForProduct(req.params.productId);
        
        res.status(200).json({
            status: 'success',
            results: bids.length,
            data: { bids }
        });
    });

    static async getBid(req, res) {
        try {
            const bid = await BidService.getBidById(req.params.id);
            if (!bid) {
                return res.status(404).json({ message: 'Bid not found' });
            }
            res.json(bid);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getProductBids(req, res) {
        try {
            const bids = await BidService.getBidsForProduct(req.params.productId);
            res.json(bids);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getUserBids(req, res) {
        try {
            const bids = await BidService.getBidsByUser(req.params.userId);
            res.json(bids);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getHighestBid(req, res) {
        try {
            const bid = await BidService.getHighestBid(req.params.productId);
            res.json(bid || { message: 'No bids yet' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteBid(req, res) {
        try {
            const bid = await BidService.getBidById(req.params.id);
            if (!bid) {
                return res.status(404).json({ message: 'Bid not found' });
            }
            
            // Only allow bid creator or admin to delete
            if (bid.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            await BidService.deleteBid(req.params.id);
            res.json({ message: 'Bid deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = BidController;