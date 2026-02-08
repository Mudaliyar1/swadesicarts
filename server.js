require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/database');
const { loadWebsiteSettings } = require('./middleware/websiteSettings');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware - Increase body size limits for large file uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
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
  secret: process.env.SESSION_SECRET || 'swadesi-carts-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(flash());

// Load website settings for all views
app.use(loadWebsiteSettings);

// Global variables middleware
app.use((req, res, next) => {
  res.locals.currentPage = '';
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAdminLoggedIn = req.session && req.session.adminId ? true : false;
  res.locals.adminName = req.session ? req.session.adminName : '';
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const seasonalRoutes = require('./routes/seasonal');
const techRoutes = require('./routes/tech');
const organicRoutes = require('./routes/organic');
const adminRoutes = require('./routes/admin');

app.use('/', publicRoutes);
app.use('/seasonal-products', seasonalRoutes);
app.use('/tech-packages', techRoutes);
app.use('/organic-products', organicRoutes);
app.use('/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('public/404', {
    title: 'Page Not Found',
    currentPage: ''
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    console.log('Multer Error Details:', err.code, err.field);
    let errorMessage = 'File upload error';
    
    switch(err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size is too large. Maximum size is 2GB per file.';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = `Unexpected file field "${err.field}". Please make sure you are uploading files in the correct fields (Featured Image and Gallery).`;
        break;
      case 'LIMIT_FIELD_COUNT':
        errorMessage = 'Too many form fields.';
        break;
      default:
        errorMessage = 'File upload error: ' + err.message;
    }
    
    req.flash('error', errorMessage);
    return res.redirect('back');
  }
  
  res.status(500).render('public/500', {
    title: 'Server Error',
    currentPage: '',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

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
  console.log(`  📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  📁 Database: ${process.env.MONGODB_URI}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
});

// Increase server timeout for large file uploads (10 minutes)
server.timeout = 600000;
server.keepAliveTimeout = 610000;
server.headersTimeout = 615000;

module.exports = app;
