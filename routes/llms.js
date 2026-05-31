const express = require('express');
const router = express.Router();
const llmsController = require('../controllers/llmsController');

router.get('/llms.txt', llmsController.getLlmsTxt);
router.get('/llms-full.txt', llmsController.getLlmsFullTxt);
router.get('/ai-catalog.json', llmsController.getAiCatalog);
router.get('/ai-manifest.json', llmsController.getAiManifest);
router.get('/entities.json', llmsController.getEntitiesJson);
router.get('/knowledge-base.json', llmsController.getKnowledgeBase);
router.get('/api/ai-discovery', llmsController.getAiDiscovery);

module.exports = router;

