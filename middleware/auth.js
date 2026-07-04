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

const isUserAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/login');
};

const isUserGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isGuest,
  isUserAuthenticated,
  isUserGuest
};
