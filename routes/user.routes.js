const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

router.get('/', auth, admin, userController.getAllUsers);
router.put('/:id/role', auth, admin, userController.updateUserRole);
router.delete('/:id', auth, admin, userController.deleteUser);

module.exports = router;