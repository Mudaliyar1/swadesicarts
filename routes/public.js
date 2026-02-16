const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const visitorController = require('../controllers/admin/visitorController');

router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/contact', publicController.getContact);
router.post('/contact', publicController.postContact);
router.post('/api/visitor', visitorController.saveVisitor);

module.exports = router;
