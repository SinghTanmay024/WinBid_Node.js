const express = require('express');
const router = express.Router();
const WinnerController = require('../controllers/winnerController');


router.post('/', WinnerController.createWinner);
router.get('/', WinnerController.getAllWinners);
router.get('/:id', WinnerController.getWinner);
router.get('/user/:userId', WinnerController.getWinnersByUser);
router.get('/product/:productId', WinnerController.getWinnersByProduct);

module.exports = router;