const User = require('../models/User');
const sendEmail = require('../helpers/email');

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

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.isVerified) {
        req.flash('error', 'Email or Phone number already registered. Please login.');
        return res.redirect('/login');
      } else {
        // Unverified user, allow to register again and resend OTP
        await User.findByIdAndDelete(existingUser._id);
      }
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Create user
    const newUser = new User({
      name,
      email,
      phone,
      password,
      isVerified: false,
      otp,
      otpExpires
    });

    await newUser.save();

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
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      req.flash('error', 'Email and OTP are required');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email || '')}`);
    }

    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'User not found. Please register.');
      return res.redirect('/register');
    }

    if (user.isVerified) {
      req.flash('info', 'Account is already verified. Please login.');
      return res.redirect('/login');
    }

    if (user.otp !== otp) {
      req.flash('error', 'Invalid OTP');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    if (user.otpExpires < new Date()) {
      req.flash('error', 'OTP has expired. Please register again.');
      // Actually we should provide a way to resend OTP, but for simplicity we ask to register again
      await User.findByIdAndDelete(user._id);
      return res.redirect('/register');
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

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        req.flash('success', 'Account verified successfully. Welcome!');
        res.redirect('/');
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    req.flash('error', 'An error occurred during verification');
    res.redirect(`/verify-otp?email=${encodeURIComponent(req.body.email || '')}`);
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

    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your account first');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // Set session
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        req.flash('success', 'Login successful');
        res.redirect('/');
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
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};
