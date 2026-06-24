const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const sendEmail = require('../helpers/email');

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

// Request OTP to change email
exports.requestEmailChangeOtp = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();

        const subject = 'Verify Email Change - Swadesi Carts';
        const htmlContent = `<p>Hello ${user.name},</p>
                             <p>You have requested to change your email address. Please use the following OTP to verify your identity before entering a new email address:</p>
                             <h2>${otp}</h2>
                             <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email and secure your account.</p>`;
        
        await sendEmail(user.email, subject, htmlContent);

        res.json({ success: true, message: 'OTP sent to your current email address.' });
    } catch (error) {
        console.error('Error sending email change OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    }
};

// Verify OTP to unlock email change
exports.verifyEmailChangeOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // OTP is correct! Clear it and grant session permission
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        req.session.canChangeEmail = true;

        res.json({ success: true, message: 'Identity verified. You may now enter a new email.' });
    } catch (error) {
        console.error('Error verifying email change OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
    }
};

// Update Email address
exports.updateEmail = async (req, res) => {
    try {
        if (!req.session.canChangeEmail) {
            return res.status(403).json({ success: false, message: 'Unauthorized. Please verify your identity first.' });
        }

        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ success: false, message: 'New email is required' });

        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'This email is already registered to another account.' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const oldEmail = user.email; // Save old email for notification
        user.email = newEmail.toLowerCase();
        await user.save();

        // Sync email change with Admin collection if applicable
        const linkedAdmin = await Admin.findOne({ email: oldEmail });
        if (linkedAdmin) {
            linkedAdmin.email = newEmail.toLowerCase();
            await linkedAdmin.save();
            
            // If they are currently logged in as admin, update their admin session too
            if (req.session.adminId && req.session.adminId.toString() === linkedAdmin._id.toString()) {
                req.session.adminEmail = linkedAdmin.email;
            }
        }

        // Send security alert to the OLD email address
        const subjectOld = 'Security Alert: Your Email Has Been Changed';
        const htmlOld = `<p>Hello ${user.name},</p>
                         <p>This is a security notification to inform you that the email address associated with your Swadesi Carts account has just been changed.</p>
                         <p><strong>Old Email:</strong> ${oldEmail}<br>
                         <strong>New Email:</strong> ${user.email}</p>
                         <p>If you made this change, no further action is required.</p>
                         <p><strong>If you did NOT make this change, please contact our support team immediately as your account may be compromised.</strong></p>`;
        await sendEmail(oldEmail, subjectOld, htmlOld).catch(err => console.error('Error sending alert to old email:', err));

        // Send confirmation to the NEW email address
        const subjectNew = 'Email Successfully Updated - Swadesi Carts';
        const htmlNew = `<p>Hello ${user.name},</p>
                         <p>Your email address has been successfully updated on Swadesi Carts!</p>
                         <p><strong>Old Email:</strong> ${oldEmail}<br>
                         <strong>New Email:</strong> ${user.email}</p>
                         <p>You can now use this new email address to log in and receive updates about your account.</p>`;
        await sendEmail(user.email, subjectNew, htmlNew).catch(err => console.error('Error sending welcome to new email:', err));

        // Update session and revoke permission
        req.session.userEmail = user.email;
        req.session.canChangeEmail = false;

        res.json({ success: true, message: 'Email updated successfully!' });
    } catch (error) {
        console.error('Error updating email:', error);
        res.status(500).json({ success: false, message: 'Failed to update email.' });
    }
};
