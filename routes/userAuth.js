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

router.post('/api/auth/check-availability', isUserGuest, userAuthController.checkAvailability);
router.post('/api/auth/resend-otp', isUserGuest, authLimiter, userAuthController.resendOTP);

// Forgot Password Flow
router.get('/forgot-password', isUserGuest, userAuthController.showForgotPassword);
router.post('/forgot-password', isUserGuest, authLimiter, userAuthController.forgotPassword);

router.get('/forgot-password/verify', isUserGuest, userAuthController.showForgotPasswordVerify);
router.post('/forgot-password/verify', isUserGuest, authLimiter, userAuthController.forgotPasswordVerify);

router.post('/api/auth/resend-reset-otp', isUserGuest, authLimiter, userAuthController.apiResendResetOTP);

router.get('/forgot-password/reset', isUserGuest, userAuthController.showForgotPasswordReset);
router.post('/forgot-password/reset', isUserGuest, authLimiter, userAuthController.forgotPasswordReset);

module.exports = router;
