const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlist.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, watchlistController.getWatchlist);
router.post('/', auth, watchlistController.addToWatchlist);
router.put('/:id', auth, watchlistController.updateWatchlistStatus);
router.delete('/:id', auth, watchlistController.removeFromWatchlist);

module.exports = router;
