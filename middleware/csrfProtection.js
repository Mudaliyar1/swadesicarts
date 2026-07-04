const { doubleCsrf } = require('csrf-csrf');

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'swadesi-carts-csrf-super-secret-key',
  getSessionIdentifier: (req) => req.session ? req.session.id : 'unknown-session',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => {
    return (req.body && req.body._csrf) || req.headers['x-csrf-token'];
  },
});

const csrfMiddleware = (req, res, next) => {
  // Use a stable session-based CSRF token to prevent multi-tab token mismatches
  const hasCookie = req.cookies && req.cookies['x-csrf-token'];
  if (!hasCookie || !req.session || !req.session.csrfToken) {
    try {
      const csrfToken = generateCsrfToken(req, res);
      if (req.session) {
        req.session.csrfToken = csrfToken;
      }
      res.locals.csrfToken = csrfToken;
    } catch (err) {
      console.error('CSRF generation error:', err);
    }
  } else {
    res.locals.csrfToken = req.session.csrfToken;
  }
  
  // Skip global validation for multipart/form-data (we will validate manually after multer parses the body)
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Apply protection
  doubleCsrfProtection(req, res, next);
};

module.exports = { 
  csrfMiddleware,
  doubleCsrfProtection
};
