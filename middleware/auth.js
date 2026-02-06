// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/admin/login');
};

// Middleware to check if user is already logged in
const isGuest = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isGuest
};
