const express = require('express');
const router = express.Router();
const { 
    getGlobalMilestones, 
    createGlobalMilestone, 
    updateGlobalMilestone, 
    deleteGlobalMilestone 
} = require('../controllers/globalMilestoneController');
const authMiddleware = require('../middleware/auth');

// Public or protected route based on if everyone should see them
// We'll make getting them just protected (must be logged in)
router.get('/', authMiddleware, getGlobalMilestones);

// Admin only routes
router.post('/', authMiddleware, authMiddleware.checkRole('ADMIN'), createGlobalMilestone);
router.put('/:id', authMiddleware, authMiddleware.checkRole('ADMIN'), updateGlobalMilestone);
router.delete('/:id', authMiddleware, authMiddleware.checkRole('ADMIN'), deleteGlobalMilestone);

module.exports = router;
