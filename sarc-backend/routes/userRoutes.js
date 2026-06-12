const express = require('express');
const router = express.Router();
const { getAllFaculty, getFacultyById, getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all routes

router.get('/faculty', getAllFaculty);
router.get('/faculty/:id', getFacultyById);

// Admin user management routes
router.get('/analytics', require('../controllers/userController').getAnalytics);
router.get('/all', getAllUsers);
router.post('/bulk', require('../controllers/userController').bulkCreateUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
