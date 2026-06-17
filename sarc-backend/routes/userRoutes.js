const express = require('express');
const router = express.Router();
const { getAllFaculty, getFacultyById, getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const cacheResponse = require('../middleware/cacheMiddleware');

router.use(auth); // Protect all routes

router.get('/faculty', cacheResponse(300), getAllFaculty);
router.get('/faculty/:id', getFacultyById);

// Admin user management routes
router.get('/analytics', auth.checkRole('ADMIN'), require('../controllers/userController').getAnalytics);
router.get('/all', auth.checkRole('ADMIN'), getAllUsers);
router.post('/bulk', auth.checkRole('ADMIN'), require('../controllers/userController').bulkCreateUsers);
router.post('/', auth.checkRole('ADMIN'), createUser);
router.put('/:id', auth.checkRole('ADMIN'), updateUser);
router.delete('/:id', auth.checkRole('ADMIN'), deleteUser);

module.exports = router;
