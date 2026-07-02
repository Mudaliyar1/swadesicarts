const express = require('express');
const adminRouter = express.Router();
const publicRouter = express.Router();
const policyController = require('../controllers/policyController');
const { isAuthenticated } = require('../middleware/auth');

// Admin Routes
adminRouter.get('/', isAuthenticated, policyController.getAdminPolicies);
adminRouter.get('/create', isAuthenticated, policyController.getCreatePolicy);
adminRouter.post('/create', isAuthenticated, policyController.postCreatePolicy);
adminRouter.get('/edit/:id', isAuthenticated, policyController.getEditPolicy);
adminRouter.get('/edit-by-slug/:slug', isAuthenticated, policyController.getEditPolicyBySlug);
adminRouter.post('/edit/:id', isAuthenticated, policyController.postEditPolicy);
adminRouter.post('/toggle-status/:id', isAuthenticated, policyController.postToggleStatus);
adminRouter.post('/delete/:id', isAuthenticated, policyController.postDeletePolicy);

// Public Routes for each standard policy slug
const standardSlugs = [
  'privacy-policy',
  'terms-and-conditions',
  'cookie-policy',
  'disclaimer',
  'refund-policy',
  'cancellation-policy',
  'shipping-policy',
  'dmca-policy'
];

standardSlugs.forEach(slug => {
  publicRouter.get(`/${slug}`, policyController.getPolicyBySlug);
});

// Generic dynamic lookup route for other policies
publicRouter.get('/:slug', policyController.getPolicyBySlug);

module.exports = {
  adminRouter,
  publicRouter
};
