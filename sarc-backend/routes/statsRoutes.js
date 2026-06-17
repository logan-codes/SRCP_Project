const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const cacheResponse = require('../middleware/cacheMiddleware');

router.get('/', cacheResponse(300), statsController.getPortalStats);

module.exports = router;
