const express = require('express');
const router = express.Router();
const seasonalController = require('../controllers/seasonalController');

router.get('/', seasonalController.getAllProducts);
router.get('/inquiry', seasonalController.getInquiryPage);
router.post('/inquiry-submit', seasonalController.submitInquiry);
router.get('/:slug', seasonalController.getProductDetail);

module.exports = router;
