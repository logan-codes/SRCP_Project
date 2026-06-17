const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// We use auth middleware to ensure only logged-in users can generate signatures
router.get('/signature', auth, uploadController.generateSignature);

module.exports = router;
