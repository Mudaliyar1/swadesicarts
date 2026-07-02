const User = require('../models/User');
const Admin = require('../models/Admin');
const sendEmail = require('../helpers/email');
const CriticalAlert = require('../models/CriticalAlert');

// In-memory cache for tracking IP OTP attempts
const ipOtpAttempts = {};

async function checkBlockedStatus(req, email, phone) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // 1. Check if IP is blocked in CriticalAlert (unresolved & unexpired)
    const activeIpAlert = await CriticalAlert.findOne({
        ipAddress: clientIp,
        isResolved: false,
        blockedUntil: { $gt: new Date() }
    });
    if (activeIpAlert) {
        return { blocked: true, message: 'Too many requests. Please try again after 1 hour.' };
    }

    // 2. Check if Email/Phone is blocked on existing User (unverified or verified)
    const matchConditions = [];
    if (email) matchConditions.push({ email: email.trim().toLowerCase() });
    if (phone) matchConditions.push({ phone: phone.trim() });

    if (matchConditions.length > 0) {
        const existingUser = await User.findOne({ $or: matchConditions });
        if (existingUser && existingUser.otpBlockedUntil && existingUser.otpBlockedUntil > new Date()) {
            return { blocked: true, message: 'Too many requests. Please try again after 1 hour.' };
        }
    }

    return { blocked: false };
}

async function recordOtpAttempt(req, email, phone) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;
    
    let user = null;
    const matchConditions = [];
    if (cleanEmail) matchConditions.push({ email: cleanEmail });
    if (cleanPhone) matchConditions.push({ phone: cleanPhone });
    
    if (matchConditions.length > 0) {
        user = await User.findOne({ $or: matchConditions });
    }

    const now = Date.now();
    
    // Track IP-level attempts
    if (!ipOtpAttempts[clientIp]) {
        ipOtpAttempts[clientIp] = { count: 0, lastAttempt: now };
    }
    
    if (now - ipOtpAttempts[clientIp].lastAttempt > 10 * 60 * 1000) {
        ipOtpAttempts[clientIp].count = 0;
    }
    
    ipOtpAttempts[clientIp].count += 1;
    ipOtpAttempts[clientIp].lastAttempt = now;

    const blockedTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour block

    // If IP attempts exceed 3
    if (ipOtpAttempts[clientIp].count >= 3) {
        await CriticalAlert.create({
            userEmail: cleanEmail,
            userPhone: cleanPhone,
            ipAddress: clientIp,
            reason: 'IP OTP spamming - 3 attempts from same IP',
            blockedUntil: blockedTime,
            isResolved: false
        });
        
        if (user) {
            user.otpBlockedUntil = blockedTime;
            user.otpAttempts = ipOtpAttempts[clientIp].count;
            await user.save();
        }
        return { blocked: true };
    }

    // Track User-level attempts
    if (user) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 3) {
            user.otpBlockedUntil = blockedTime;
            await user.save();

            await CriticalAlert.create({
                userEmail: user.email,
                userPhone: user.phone,
                ipAddress: clientIp,
                reason: 'OTP spamming - more than 3 attempts',
                blockedUntil: blockedTime,
                isResolved: false
            });
            return { blocked: true };
        }
        await user.save();
    }

    return { blocked: false };
}

// Show register page
exports.showRegister = (req, res) => {
  res.render('public/register', {
    title: 'Register | Swadesi Carts',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle registration
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validate inputs
    if (!name || !email || !phone || !password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if blocked by IP or email/phone
    const blockCheck = await checkBlockedStatus(req, cleanEmail, cleanPhone);
    if (blockCheck.blocked) {
      req.flash('error', blockCheck.message);
      return res.redirect('/register');
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash('error', 'Please enter a valid email address');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/register');
    }

    // Check if user already exists (forcing lowercase check)
    const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    if (existingUser) {
      if (existingUser.isVerified) {
        req.flash('error', 'Email or Phone number already registered. Please login.');
        return res.redirect('/login');
      } else {
        // Unverified user, block re-registration and redirect to verify page
        req.flash('success', 'An account with this email or phone is already registered and pending verification. Please verify your OTP.');
        return res.redirect(`/verify-otp?email=${encodeURIComponent(existingUser.email)}`);
      }
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Create user
    const newUser = new User({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      isVerified: false,
      otp,
      otpExpires
    });

    await newUser.save();

    // Record OTP attempt (registers first attempt)
    await recordOtpAttempt(req, cleanEmail, cleanPhone);

    // Send OTP via Nodemailer
    try {
      const subject = 'Verify your account - Swadesi Carts';
      const htmlContent = `<p>Hello ${newUser.name},</p><p>Thank you for registering with Swadesi Carts. Your OTP for account verification is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`;
      
      await sendEmail(newUser.email, subject, htmlContent);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      req.flash('error', 'Failed to send verification email. Please check your email configuration.');
      // Keep the user but let them request a new OTP later, or delete and force re-register.
      // We'll let them re-register.
      await User.findByIdAndDelete(newUser._id);
      return res.redirect('/register');
    }

    req.flash('success', 'Registration successful. Please check your email for the OTP.');
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'An error occurred during registration');
    res.redirect('/register');
  }
};

// Show OTP Verification page
exports.showVerifyOTP = (req, res) => {
  const email = req.query.email;
  if (!email) {
    req.flash('error', 'Invalid verification request');
    return res.redirect('/register');
  }

  res.render('public/verify-otp', {
    title: 'Verify OTP | Swadesi Carts',
    email,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle OTP Verification
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const sendResponse = (success, message, redirectUrl, status = 200) => {
    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
    if (isAjax) {
      return res.status(status).json({ success, message, redirect: redirectUrl });
    } else {
      if (success) {
        req.flash('success', message);
      } else {
        req.flash('error', message);
      }
      return res.redirect(redirectUrl);
    }
  };

  try {
    if (!email || !otp) {
      return sendResponse(false, 'Email and OTP are required', `/verify-otp?email=${encodeURIComponent(email || '')}`, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return sendResponse(false, 'User not found. Please register.', '/register', 404);
    }

    if (user.isVerified) {
      return sendResponse(true, 'Account is already verified. Please login.', '/login');
    }

    if (user.otp !== otp) {
      return sendResponse(false, 'Invalid OTP', `/verify-otp?email=${encodeURIComponent(email)}`, 400);
    }

    if (user.otpExpires < new Date()) {
      await User.findByIdAndDelete(user._id);
      return sendResponse(false, 'OTP has expired. Please register again.', '/register', 400);
    }

    // Verify user
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Log the user in
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    // Check for linked Admin account and sync session
    const linkedAdmin = await Admin.findOne({ email: user.email, isActive: true });
    if (linkedAdmin) {
      req.session.adminId = linkedAdmin._id;
      req.session.adminName = linkedAdmin.name;
      req.session.adminEmail = linkedAdmin.email;
    }

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
        if (isAjax) {
          return res.json({ success: true, redirect: '/' });
        } else {
          req.flash('success', 'Account verified successfully. Welcome!');
          return res.redirect('/');
        }
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    return sendResponse(false, 'An error occurred during verification', `/verify-otp?email=${encodeURIComponent(email || '')}`, 500);
  }
};

// Show Login page
exports.showLogin = (req, res) => {
  res.render('public/login', {
    title: 'Login | Swadesi Carts',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please provide email and password');
      return res.redirect('/login');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail, isActive: true }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      req.flash('error', 'Account locked due to too many failed attempts. Try again later.');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your account first');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      await user.save();

      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // Reset login attempts and track security details on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginIp = req.ip || req.connection.remoteAddress;
    user.lastLoginUserAgent = req.headers['user-agent'] || 'Unknown Device';
    await user.save();

    // Check for linked Admin account and sync session
    const linkedAdmin = await Admin.findOne({ email: user.email, isActive: true });
    
    // Rotate session ID to prevent Session Fixation
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        req.flash('error', 'An error occurred during login');
        return res.redirect('/login');
      }

      // Set session
      req.session.userId = user._id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;

      if (linkedAdmin) {
        req.session.adminId = linkedAdmin._id;
        req.session.adminName = linkedAdmin.name;
        req.session.adminEmail = linkedAdmin.email;
      }

      req.session.save((saveErr) => {
          if (saveErr) console.error('Session save error:', saveErr);
          req.flash('success', 'Login successful');
          res.redirect('/');
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
};

// Handle Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};

// Check availability of email and phone in real time
exports.checkAvailability = async (req, res) => {
  try {
    const { email, phone } = req.body;
    let emailAvailable = true;
    let phoneAvailable = true;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        emailAvailable = false;
      }
    }

    if (phone) {
      const cleanPhone = phone.trim();
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        phoneAvailable = false;
      }
    }

    return res.json({
      success: true,
      emailAvailable,
      phoneAvailable
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({ success: false, message: 'Server error check' });
  }
};

// Handle Resend OTP via AJAX
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if blocked by IP or Email
    const blockCheck = await checkBlockedStatus(req, cleanEmail, null);
    if (blockCheck.blocked) {
      return res.status(429).json({ success: false, message: blockCheck.message });
    }

    // Record attempt
    const attemptCheck = await recordOtpAttempt(req, cleanEmail, null);
    if (attemptCheck.blocked) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again after 1 hour.' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please login.' });
    }

    // Generate new OTP and update expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send email
    try {
      const subject = 'Verify your account - Resend OTP - Swadesi Carts';
      const htmlContent = `<p>Hello ${user.name},</p><p>Your new OTP for account verification is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`;
      await sendEmail(user.email, subject, htmlContent);
    } catch (emailError) {
      console.error('Error sending resend email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }

    return res.json({ success: true, message: 'OTP resent successfully. Please check your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

// Clear in-memory IP OTP attempts cache when admin releases the block
exports.clearIpAttempts = (ip) => {
  if (ip && ipOtpAttempts[ip]) {
    delete ipOtpAttempts[ip];
  }
};

// Show Forgot Password request form
exports.showForgotPassword = (req, res) => {
  res.render('public/forgot-password', {
    title: 'Forgot Password - Swadesi Carts',
    success: req.flash('success'),
    error: req.flash('error')
  });
};

// Process Forgot Password request
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      req.flash('error', 'Please enter your email address');
      return res.redirect('/forgot-password');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      req.flash('error', 'User with this email address does not exist');
      return res.redirect('/forgot-password');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.resetOtpAttempts = 0;
    user.resetOtpLastSent = new Date();
    await user.save();

    // Send reset email
    try {
      const subject = 'Reset your password - Swadesi Carts';
      const htmlContent = `<p>Hello ${user.name},</p><p>We received a request to reset your password. Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>`;
      await sendEmail(user.email, subject, htmlContent);
    } catch (emailError) {
      console.error('Error sending reset OTP email:', emailError);
      req.flash('error', 'Failed to send OTP email. Please try again.');
      return res.redirect('/forgot-password');
    }

    req.flash('success', 'A password reset code has been sent to your email.');
    res.redirect(`/forgot-password/verify?email=${encodeURIComponent(cleanEmail)}`);
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/forgot-password');
  }
};

// Show Forgot Password OTP verification page
exports.showForgotPasswordVerify = (req, res) => {
  const { email } = req.query;
  if (!email) {
    req.flash('error', 'Invalid password reset request');
    return res.redirect('/forgot-password');
  }
  res.render('public/forgot-password-verify', {
    title: 'Verify Password Reset - Swadesi Carts',
    email: email.trim().toLowerCase(),
    success: req.flash('success'),
    error: req.flash('error')
  });
};

// Process OTP Verification (AJAX)
exports.forgotPasswordVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if OTP exists and is not expired
    if (!user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check if attempts exceeded
    if (user.resetOtpAttempts >= 5) {
      // Invalidate OTP
      user.resetOtp = null;
      user.resetOtpExpires = null;
      user.resetOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ success: false, message: 'Too many verification attempts. This OTP has been invalidated. Please request a new code.' });
    }

    if (user.resetOtp !== otp.trim()) {
      user.resetOtpAttempts += 1;
      await user.save();

      if (user.resetOtpAttempts >= 5) {
        // Invalidate OTP
        user.resetOtp = null;
        user.resetOtpExpires = null;
        user.resetOtpAttempts = 0;
        await user.save();
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new code.' });
      }

      return res.status(400).json({ success: false, message: `Incorrect OTP. You have ${5 - user.resetOtpAttempts} attempts left.` });
    }

    // Verification successful. Set reset session parameter.
    req.session.resetEmail = user.email;
    
    return res.json({ success: true, redirect: '/forgot-password/reset' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

// API: Resend Reset OTP with 15-second cooldown
exports.apiResendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cooldown check: 15 seconds
    const now = new Date();
    if (user.resetOtpLastSent && (now - user.resetOtpLastSent < 15 * 1000)) {
      const waitTime = Math.ceil((15 * 1000 - (now - user.resetOtpLastSent)) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${waitTime} seconds before requesting a new OTP.` });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.resetOtpAttempts = 0;
    user.resetOtpLastSent = now;
    await user.save();

    // Send email
    try {
      const subject = 'Resend Reset OTP - Swadesi Carts';
      const htmlContent = `<p>Hello ${user.name},</p><p>Your password reset OTP has been resent. Your code is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes. If you did not request this, please ignore it.</p>`;
      await sendEmail(user.email, subject, htmlContent);
    } catch (emailError) {
      console.error('Error sending resend reset OTP email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }

    return res.json({ success: true, message: 'New password reset OTP sent successfully.' });
  } catch (error) {
    console.error('Resend reset OTP error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
};

// Show New Password Reset entry form
exports.showForgotPasswordReset = (req, res) => {
  if (!req.session.resetEmail) {
    req.flash('error', 'Session expired. Please request a password reset again.');
    return res.redirect('/forgot-password');
  }

  res.render('public/forgot-password-reset', {
    title: 'Reset Password - Swadesi Carts',
    email: req.session.resetEmail,
    success: req.flash('success'),
    error: req.flash('error')
  });
};

// Process Password Reset Submission
exports.forgotPasswordReset = async (req, res) => {
  try {
    if (!req.session.resetEmail) {
      req.flash('error', 'Session expired. Please request a password reset again.');
      return res.redirect('/forgot-password');
    }

    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      req.flash('error', 'All fields are required');
      return res.redirect('/forgot-password/reset');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long');
      return res.redirect('/forgot-password/reset');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/forgot-password/reset');
    }

    const user = await User.findOne({ email: req.session.resetEmail });
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/forgot-password');
    }

    // Set new password (pre-save middleware automatically hashes it!)
    user.password = password;
    
    // Clear reset OTP fields
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.resetOtpAttempts = 0;
    user.resetOtpLastSent = null;

    await user.save();

    // Clean up reset session
    delete req.session.resetEmail;

    req.flash('success', 'Your password has been successfully reset. Please log in with your new password.');
    res.redirect('/login');
  } catch (error) {
    console.error('Reset password submission error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/forgot-password/reset');
  }
};
