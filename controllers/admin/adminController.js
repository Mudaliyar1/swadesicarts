const Admin = require('../../models/Admin');

// List all admins
exports.list = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    
    res.render('admin/admins/list', {
      title: 'Admin Management',
      admins,
      adminName: req.session.adminName,
      currentPage: 'admins',
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).send('Server Error');
  }
};

// Show create form
exports.showCreate = (req, res) => {
  res.render('admin/admins/create', {
    title: 'Add Admin User',
    adminName: req.session.adminName,
    currentPage: 'admins',
    error: req.flash('error')
  });
};

// Create admin
exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.flash('error', 'Email already exists');
      return res.redirect('/admin/admins/create');
    }

    await Admin.create({
      name,
      email,
      password,
      role: role || 'admin'
    });

    req.flash('success', 'Admin user created successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Create error:', error);
    req.flash('error', 'An error occurred while creating the admin');
    res.redirect('/admin/admins/create');
  }
};

// Show edit form
exports.showEdit = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      req.flash('error', 'Admin not found');
      return res.redirect('/admin/admins');
    }

    res.render('admin/admins/edit', {
      title: 'Edit Admin User',
      admin,
      adminName: req.session.adminName,
      currentPage: 'admins',
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Show edit error:', error);
    req.flash('error', 'An error occurred');
    res.redirect('/admin/admins');
  }
};

// Update admin
exports.update = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      req.flash('error', 'Admin not found');
      return res.redirect('/admin/admins');
    }

    // Check if email is taken by another admin
    if (email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        req.flash('error', 'Email already taken');
        return res.redirect(`/admin/admins/edit/${req.params.id}`);
      }
    }

    admin.name = name;
    admin.email = email;
    admin.role = role || 'admin';
    
    if (password && password.trim()) {
      admin.password = password;
    }

    await admin.save();

    req.flash('success', 'Admin user updated successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Update error:', error);
    req.flash('error', 'An error occurred while updating the admin');
    res.redirect(`/admin/admins/edit/${req.params.id}`);
  }
};

// Delete admin
exports.delete = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Prevent deleting current admin
    if (admin._id.toString() === req.session.adminId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the admin' });
  }
};
