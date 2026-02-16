const Admin = require('../models/Admin');

// Show login page
exports.showLogin = (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Handle login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      req.flash('error', 'Please provide email and password');
      return res.redirect('/admin/login');
    }

    // Find admin
    const admin = await Admin.findOne({ email, isActive: true });
    
    if (!admin) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin/login');
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin/login');
    }

    // Set session
    req.session.adminId = admin._id;
    req.session.adminName = admin.name;
    req.session.adminEmail = admin.email;

    req.flash('success', 'Login successful');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login');
    res.redirect('/admin/login');
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
};

// Show dashboard
exports.showDashboard = async (req, res) => {
  try {
    const SeasonalProduct = require('../models/SeasonalProduct');
    const TechPackage = require('../models/TechPackage');
    const OrganicProduct = require('../models/OrganicProduct');
    const Inquiry = require('../models/Inquiry');
    const Story = require('../models/Story');

    const stats = {
      seasonalProducts: await SeasonalProduct.countDocuments(),
      techPackages: await TechPackage.countDocuments(),
      organicProducts: await OrganicProduct.countDocuments(),
      totalInquiries: await Inquiry.countDocuments(),
      newInquiries: await Inquiry.countDocuments({ status: 'new' }),
      contactedInquiries: await Inquiry.countDocuments({ status: 'contacted' }),
      closedInquiries: await Inquiry.countDocuments({ status: 'closed' }),
      stories: await Story.countDocuments()
    };

    const recentInquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats,
      recentInquiries,
      adminName: req.session.adminName,
      currentPage: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server Error');
  }
};
