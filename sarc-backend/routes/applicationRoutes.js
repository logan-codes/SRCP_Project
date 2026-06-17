const express = require('express');
const router = express.Router();
const { applyForProject, getStudentApplications, getFacultyApplications, updateApplicationStatus } = require('../controllers/applicationController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Application routes
router.post('/apply', auth.checkRole('STUDENT'), applyForProject);
router.get('/student', auth.checkRole('STUDENT'), getStudentApplications);

// Faculty routes
router.get('/faculty', auth.checkRole('FACULTY'), getFacultyApplications);
router.put('/:id/status', auth.checkRole('FACULTY'), updateApplicationStatus);

module.exports = router;
