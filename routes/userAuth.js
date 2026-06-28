const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const { isUserGuest } = require('../middleware/auth');
const { loginLimiter, authLimiter } = require('../middleware/rateLimiters');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');

router.get('/register', isUserGuest, userAuthController.showRegister);
router.post('/register', isUserGuest, authLimiter, validate(registerSchema), userAuthController.register);

router.get('/verify-otp', isUserGuest, userAuthController.showVerifyOTP);
router.post('/verify-otp', isUserGuest, authLimiter, userAuthController.verifyOTP);

router.get('/login', isUserGuest, userAuthController.showLogin);
router.post('/login', isUserGuest, loginLimiter, validate(loginSchema), userAuthController.login);

router.get('/logout', userAuthController.logout);

module.exports = router;
