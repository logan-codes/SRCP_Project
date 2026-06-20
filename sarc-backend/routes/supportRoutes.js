const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

// @route   POST api/support/contact
// @desc    Submit a contact form to admins
// @access  Public
router.post('/contact', supportController.contactAdmin);

// @route   POST api/support/reply
// @desc    Reply to a contact form
// @access  Admin
router.post('/reply', supportController.replyTicket);

module.exports = router;
