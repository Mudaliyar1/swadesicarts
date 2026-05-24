const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { isAuthenticated } = require('../middleware/auth');
const { parseMediaQuery, normalizeBulkDeleteBody } = require('../middleware/mediaMiddleware');

router.get('/', isAuthenticated, parseMediaQuery, mediaController.index);
router.get('/refresh', isAuthenticated, mediaController.refresh);
router.get('/:publicId/detail', isAuthenticated, mediaController.showDetail);
router.get('/:publicId/download', isAuthenticated, mediaController.downloadRedirect);
router.delete('/bulk', isAuthenticated, normalizeBulkDeleteBody, mediaController.bulkDelete);
router.delete('/:publicId', isAuthenticated, mediaController.deleteMedia);

module.exports = router;
