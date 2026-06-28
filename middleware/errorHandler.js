const winston = require('winston');

// Setup Winston Logger for production-grade logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const errorHandler = (err, req, res, next) => {
  // Log the error internally (never expose to user)
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack); // Stack trace stays in logs, not in response

  // Handle Multer errors explicitly
  if (err.name === 'MulterError') {
    let errorMessage = 'File upload error';
    switch(err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size is too large. Maximum size is 2GB per file.';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = `Unexpected file field "${err.field}".`;
        break;
      case 'LIMIT_FIELD_COUNT':
        errorMessage = 'Too many form fields.';
        break;
      default:
        errorMessage = 'File upload error: ' + err.message;
    }
    
    if (req.flash) req.flash('error', errorMessage);
    return res.redirect('back');
  }

  // Handle CSRF Token Errors
  if (err.code === 'EBADCSRFTOKEN') {
    if (req.flash) req.flash('error', 'Form session expired or invalid CSRF token. Please refresh and try again.');
    return res.status(403).redirect('back');
  }

  // Generic sanitized error for all other unhandled issues
  res.status(err.status || 500);
  
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({
          success: false,
          message: 'An internal server error occurred.'
      });
  }

  res.render('public/404', {
      title: 'Server Error',
      currentPage: '',
      siteSettings: res.locals.siteSettings || {}, 
      isAdminLoggedIn: res.locals.isAdminLoggedIn || false,
      isUserLoggedIn: res.locals.isUserLoggedIn || false,
      adminName: res.locals.adminName || '',
      userName: res.locals.userName || '',
      message: 'We experienced an internal server error. Please try again later.'
  });
};

module.exports = { errorHandler, logger };
