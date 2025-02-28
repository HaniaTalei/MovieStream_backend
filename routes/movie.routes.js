const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movie.controller');
const ratingController = require('../controllers/rating.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Public routes
router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieById);


// Rating routes
router.get('/:movieId/rating', ratingController.getMovieRating);
router.get('/:movieId/myrating', authMiddleware, ratingController.getUserMovieRating);
router.post('/:movieId/rate', authMiddleware, ratingController.rateMovie);
router.delete('/:movieId/rate', authMiddleware, ratingController.deleteRating);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, movieController.addMovie);
router.put('/:id', authMiddleware, adminMiddleware, movieController.updateMovie);
router.delete('/:id', authMiddleware, adminMiddleware, movieController.deleteMovie);

module.exports = router;


