const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Show Profile Page
exports.showProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        res.render('public/profile', {
            title: 'My Profile | Swadesi Carts',
            user,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        req.flash('error', 'An error occurred while loading your profile.');
        res.redirect('/');
    }
};

// Update Profile Info
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        if (!name || !phone) {
            req.flash('error', 'Name and Phone are required.');
            return res.redirect('/profile');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        user.name = name;
        user.phone = phone;
        await user.save();

        // Update session name if it changed
        req.session.userName = name;

        req.flash('success', 'Profile updated successfully.');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error', 'An error occurred while updating your profile.');
        res.redirect('/profile');
    }
};

// Update Password
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            req.flash('error', 'All password fields are required.');
            return res.redirect('/profile');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match.');
            return res.redirect('/profile');
        }

        if (newPassword.length < 6) {
            req.flash('error', 'New password must be at least 6 characters long.');
            return res.redirect('/profile');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('error', 'Incorrect current password.');
            return res.redirect('/profile');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        req.flash('success', 'Password updated successfully.');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating password:', error);
        req.flash('error', 'An error occurred while updating your password.');
        res.redirect('/profile');
    }
};
