const express = require('express');
const router = express.Router();
const techController = require('../controllers/techController');

router.get('/', techController.getAllPackages);
router.get('/inquiry', techController.getInquiryPage);
router.post('/inquiry-submit', techController.submitInquiry);
router.get('/:slug', techController.getPackageDetail);

module.exports = router;
