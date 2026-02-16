const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const seasonalProductController = require('../controllers/admin/seasonalProductController');
const techPackageController = require('../controllers/admin/techPackageController');
const organicProductController = require('../controllers/admin/organicProductController');
const inquiryController = require('../controllers/admin/inquiryController');
const adminController = require('../controllers/admin/adminController');
const storyController = require('../controllers/admin/storyController');
const websiteSettingController = require('../controllers/admin/websiteSettingController');
const visitorController = require('../controllers/admin/visitorController');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const upload = require('../config/multer');

// Auth routes
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);
router.get('/logout', authController.logout);

// Dashboard
router.get('/dashboard', isAuthenticated, authController.showDashboard);

// Seasonal Products routes
router.get('/seasonal-products', isAuthenticated, seasonalProductController.list);
router.get('/seasonal-products/create', isAuthenticated, seasonalProductController.showCreate);
router.post('/seasonal-products/create', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), seasonalProductController.create);
router.get('/seasonal-products/edit/:id', isAuthenticated, seasonalProductController.showEdit);
router.post('/seasonal-products/edit/:id', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), seasonalProductController.update);
router.delete('/seasonal-products/:id', isAuthenticated, seasonalProductController.delete);
router.delete('/seasonal-products/:productId/gallery/:itemId', isAuthenticated, seasonalProductController.deleteGalleryItem);

// Tech Packages routes
router.get('/tech-packages', isAuthenticated, techPackageController.list);
router.get('/tech-packages/create', isAuthenticated, techPackageController.showCreate);
router.post('/tech-packages/create', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), techPackageController.create);
router.get('/tech-packages/edit/:id', isAuthenticated, techPackageController.showEdit);
router.post('/tech-packages/edit/:id', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), techPackageController.update);
router.delete('/tech-packages/:id', isAuthenticated, techPackageController.delete);
router.delete('/tech-packages/:productId/gallery/:itemId', isAuthenticated, techPackageController.deleteGalleryItem);

// Organic Products routes
router.get('/organic-products', isAuthenticated, organicProductController.list);
router.get('/organic-products/create', isAuthenticated, organicProductController.showCreate);
router.post('/organic-products/create', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), organicProductController.create);
router.get('/organic-products/edit/:id', isAuthenticated, organicProductController.showEdit);
router.post('/organic-products/edit/:id', isAuthenticated, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), organicProductController.update);
router.delete('/organic-products/:id', isAuthenticated, organicProductController.delete);
router.delete('/organic-products/:productId/gallery/:itemId', isAuthenticated, organicProductController.deleteGalleryItem);

// Inquiries routes
router.get('/inquiries', isAuthenticated, inquiryController.list);
router.get('/inquiries/:id', isAuthenticated, inquiryController.view);
router.post('/inquiries/:id/status', isAuthenticated, inquiryController.updateStatus);
router.delete('/inquiries/:id', isAuthenticated, inquiryController.delete);
router.get('/inquiries/:id/pdf', isAuthenticated, inquiryController.downloadPDF);

// Admin users routes
router.get('/admins', isAuthenticated, adminController.list);
router.get('/admins/create', isAuthenticated, adminController.showCreate);
router.post('/admins/create', isAuthenticated, adminController.create);
router.get('/admins/edit/:id', isAuthenticated, adminController.showEdit);
router.post('/admins/edit/:id', isAuthenticated, adminController.update);
router.delete('/admins/delete/:id', isAuthenticated, adminController.delete);

// Visitors routes
router.get('/visitors', isAuthenticated, visitorController.getAllVisitors);
router.delete('/visitors/:id', isAuthenticated, visitorController.deleteVisitor);

// Stories routes
router.get('/stories', isAuthenticated, storyController.list);
router.get('/stories/create', isAuthenticated, storyController.showCreate);
router.post('/stories/create', isAuthenticated, upload.fields([
  { name: 'media', maxCount: 10 }
]), storyController.create);
router.get('/stories/edit/:id', isAuthenticated, storyController.showEdit);
router.post('/stories/edit/:id', isAuthenticated, upload.fields([
  { name: 'media', maxCount: 10 }
]), storyController.update);
router.delete('/stories/delete/:id', isAuthenticated, storyController.delete);
router.post('/stories/:id/toggle', isAuthenticated, storyController.toggleActive);

// Website Settings routes
router.get('/settings', isAuthenticated, websiteSettingController.getSettings);
router.post('/settings', isAuthenticated, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'aboutImage', maxCount: 1 }
]), websiteSettingController.updateSettings);
router.delete('/settings/logo', isAuthenticated, websiteSettingController.deleteLogo);
router.delete('/settings/about-image', isAuthenticated, websiteSettingController.deleteAboutImage);

module.exports = router;
