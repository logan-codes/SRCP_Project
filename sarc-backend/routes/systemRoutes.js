const express = require('express');
const prisma = require('../config/prismaClient');

const router = express.Router();

/**
 * GET /api/stats
 * Returns system statistics for the public landing page.
 */
router.get('/stats', async (req, res, next) => {
    try {
        const [students, faculty, domains, teams] = await Promise.all([
            prisma.student.count({ where: { is_active: true } }),
            prisma.faculty.count({ where: { is_active: true } }),
            prisma.domain.count({ where: { is_active: true } }),
            prisma.team.count({ where: { is_active: true } })
        ]);

        res.json({
            students,
            faculty,
            domains,
            projects: teams // Map teams to projects count for frontend landing page stats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
