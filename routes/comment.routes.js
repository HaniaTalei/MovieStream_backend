const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const authMiddleware = require('../middlewares/auth.middleware');



router.get('/:movieId/comments', commentController.getMovieComments);
router.post('/:movieId/comments', authMiddleware, commentController.addComment);

// Admin routes
router.get('/', auth, admin, commentController.getAllComments);
router.put('/:id/approve', auth, admin, commentController.approveComment);

// User or admin routes
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;