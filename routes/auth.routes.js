const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Define routes
router.post('/signup', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authController.logout);

module.exports = router;
