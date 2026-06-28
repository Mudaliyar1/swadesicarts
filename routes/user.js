const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isUserAuthenticated } = require('../middleware/auth');
const { avatarUpload, validateMagicNumbers } = require('../middleware/avatarUpload');

router.get('/profile', isUserAuthenticated, userController.showProfile);
router.post('/profile', isUserAuthenticated, userController.updateProfile);
router.post('/profile/avatar', isUserAuthenticated, avatarUpload.single('avatar'), validateMagicNumbers, userController.uploadAvatar);
router.post('/profile/password', isUserAuthenticated, userController.updatePassword);

// Secure Email Change Routes
router.post('/profile/email/request-otp', isUserAuthenticated, userController.requestEmailChangeOtp);
router.post('/profile/email/verify-otp', isUserAuthenticated, userController.verifyEmailChangeOtp);
router.post('/profile/email/update', isUserAuthenticated, userController.updateEmail);

module.exports = router;
