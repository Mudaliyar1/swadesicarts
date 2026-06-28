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
  // Generate the token and make it available to all views
  const csrfToken = generateCsrfToken(req, res);
  res.locals.csrfToken = csrfToken;
  
  // Apply protection
  doubleCsrfProtection(req, res, next);
};

module.exports = { csrfMiddleware };
