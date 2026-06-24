const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const { isUserGuest } = require('../middleware/auth');

router.get('/register', isUserGuest, userAuthController.showRegister);
router.post('/register', isUserGuest, userAuthController.register);

router.get('/verify-otp', isUserGuest, userAuthController.showVerifyOTP);
router.post('/verify-otp', isUserGuest, userAuthController.verifyOTP);

router.get('/login', isUserGuest, userAuthController.showLogin);
router.post('/login', isUserGuest, userAuthController.login);

router.get('/logout', userAuthController.logout);

module.exports = router;
