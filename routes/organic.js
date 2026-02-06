const express = require('express');
const router = express.Router();
const organicController = require('../controllers/organicController');

router.get('/', organicController.getAllProducts);
router.get('/inquiry', organicController.getInquiryPage);
router.post('/inquiry-submit', organicController.submitInquiry);
router.get('/:slug', organicController.getProductDetail);

module.exports = router;
