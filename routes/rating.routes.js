const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.get('/:movieId/rating', ratingController.getMovieRating);

// Protected routes (require authentication)
router.get('/:movieId/myrating', authMiddleware, ratingController.getUserMovieRating);
router.post('/:movieId/rate', authMiddleware, ratingController.rateMovie);
router.delete('/:movieId/rate', authMiddleware, ratingController.deleteRating);
router.get('/me/ratings', authMiddleware, ratingController.getUserRatings);

module.exports = router;