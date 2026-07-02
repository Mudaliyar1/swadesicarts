require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/database');
const { loadWebsiteSettings } = require('./middleware/websiteSettings');
const seoMiddleware = require('./middleware/seoMiddleware');
const geoMiddleware = require('./middleware/geoMiddleware');
const startEmailSync = require('./services/emailSync');
const { Server } = require('socket.io');
const mongoSanitize = require('express-mongo-sanitize');
const securityValidation = require('./middleware/securityValidation');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { csrfMiddleware } = require('./middleware/csrfProtection');
const { globalLimiter } = require('./middleware/rateLimiters');
const { errorHandler } = require('./middleware/errorHandler');
const seedPolicies = require('./services/policySeeder');
const { publicRouter: publicPolicyRoutes } = require('./routes/policyRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Remove Express fingerprinting
app.disable('x-powered-by');

// Trust proxies to get correct internet IPs (for Cloudflare/Nginx)
app.set('trust proxy', 1);

// Production Logging
// if (process.env.NODE_ENV === 'production') {
//     app.use(morgan('combined'));
// } else {
//     app.use(morgan('dev'));
// }

// Helmet Security Headers (Strict CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://flagcdn.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      "media-src": ["'self'", "blob:", "https://res.cloudinary.com"],
      "connect-src": ["'self'", "https://d1zv2aa70wpiur.cloudfront.net", "https://s3.amazonaws.com", "https://storage.googleapis.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "blob:", "data:"]
    },
  },
  crossOriginEmbedderPolicy: false // Prevent breaking external cloudinary/flagcdn images
}));

// Cross-Origin Resource Sharing
app.use(cors());

// Connect to MongoDB
connectDB().then(() => {
    seedPolicies();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware - Increase body size limits for large file uploads
app.use(express.json({ limit: '10mb' })); // Reduced JSON size for DOS protection
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Reduced URL Encoded size for DOS protection

// HTTP Parameter Pollution Protection
app.use(hpp());



app.get('/favicon.ico', (req, res) => res.redirect(301, '/favicon.svg'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Increase timeout for large uploads (10 minutes)
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});

// Session configuration
app.use(session({
  name: 'swadesi.sid', // Mask default connect.sid
  secret: process.env.SESSION_SECRET || 'swadesi-carts-secret-key-super-secure',
  resave: false,
  saveUninitialized: false, // Don't save empty sessions
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true, // Prevent XSS stealing cookies
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax' // CSRF mitigation
  }
}));

// Cookie Parser (required for CSRF)
app.use(cookieParser(process.env.SESSION_SECRET || 'swadesi-carts-secret-key-super-secure'));

// Apply CSRF Protection to all routes
app.use(csrfMiddleware);

app.use(flash());

// Load website settings for all views
app.use(loadWebsiteSettings);

// Load SEO defaults for all public/admin pages
app.use(seoMiddleware);

// Load GEO defaults for all pages
app.use(geoMiddleware);

// Global variables middleware
app.use((req, res, next) => {
  res.locals.currentPage = '';
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAdminLoggedIn = req.session && req.session.adminId ? true : false;
  res.locals.adminName = req.session ? req.session.adminName : '';
  res.locals.isUserLoggedIn = req.session && req.session.userId ? true : false;
  res.locals.userName = req.session ? req.session.userName : '';
  next();
});

// Apply Global Rate Limiter
app.use(globalLimiter);

// Global Security Middleware
app.use(mongoSanitize({
  replaceWith: '_' // Replaces prohibited characters ($, .) with an underscore
}));
app.use(securityValidation);

// Routes
const publicRoutes = require('./routes/public');
const sitemapRoutes = require('./routes/sitemap');
const seasonalRoutes = require('./routes/seasonal');
const techRoutes = require('./routes/tech');
const organicRoutes = require('./routes/organic');
const adminRoutes = require('./routes/admin');
const llmsRoutes = require('./routes/llms');
const userAuthRoutes = require('./routes/userAuth');
const userRoutes = require('./routes/user');
const ticketRoutes = require('./routes/ticket');

app.use('/', publicRoutes);
app.use('/', userAuthRoutes);
app.use('/', userRoutes);
app.use('/', sitemapRoutes);
app.use('/', llmsRoutes);
app.use('/seasonal-products', seasonalRoutes);
app.use('/tech-packages', techRoutes);
app.use('/organic-products', organicRoutes);
app.use('/admin', adminRoutes);
app.use('/tickets', ticketRoutes);
app.use('/', publicPolicyRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('public/404', {
    title: 'Page Not Found',
    currentPage: ''
  });
});

// Error Handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🌿 SWADESI CARTS - Server Started Successfully 🌿');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`  🌐 Public Website:  http://localhost:${PORT}`);
  console.log(`  🔐 Admin Dashboard: http://localhost:${PORT}/admin/login`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
  
  // Start the IMAP background worker
  startEmailSync(app);
});

// Setup Socket.io
const io = new Server(server);
app.set('io', io);

io.on('connection', (socket) => {
  // Client joins a specific ticket room
  socket.on('joinTicket', (ticketNumber) => {
    socket.join(ticketNumber);
  });

  // Client emits typing event
  socket.on('typing', (data) => {
    // data should contain { ticketNumber, sender: 'admin' | 'user' }
    socket.to(data.ticketNumber).emit('typing', data);
  });

  // Client emits stop typing event
  socket.on('stopTyping', (data) => {
    socket.to(data.ticketNumber).emit('stopTyping', data);
  });
});

// Increase server timeout for large file uploads (10 minutes)
server.timeout = 600000;
server.keepAliveTimeout = 610000;
server.headersTimeout = 615000;

module.exports = app;
