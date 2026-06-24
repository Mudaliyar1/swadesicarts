const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isUserAuthenticated } = require('../middleware/auth');

router.get('/profile', isUserAuthenticated, userController.showProfile);
router.post('/profile', isUserAuthenticated, userController.updateProfile);
router.post('/profile/password', isUserAuthenticated, userController.updatePassword);

module.exports = router;
