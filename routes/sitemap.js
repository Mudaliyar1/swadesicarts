const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

router.get('/sitemap.xml', sitemapController.getSitemap);
router.get('/geositemap.xml', sitemapController.getGeoSitemap);

module.exports = router;