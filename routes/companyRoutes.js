const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../config/multer');
const { doubleCsrfProtection } = require('../middleware/csrfProtection');

router.get('/', isAuthenticated, companyController.list);
router.get('/create', isAuthenticated, companyController.showCreate);
router.post('/create', isAuthenticated, upload.fields([
  { name: 'logo', maxCount: 1 }
]), doubleCsrfProtection, companyController.create);
router.get('/edit/:id', isAuthenticated, companyController.showEdit);
router.post('/edit/:id', isAuthenticated, upload.fields([
  { name: 'logo', maxCount: 1 }
]), doubleCsrfProtection, companyController.update);
router.delete('/delete/:id', isAuthenticated, companyController.delete);
router.post('/:id/toggle-visibility', isAuthenticated, companyController.toggleVisibility);
router.post('/:id/toggle-featured', isAuthenticated, companyController.toggleFeatured);

module.exports = router;