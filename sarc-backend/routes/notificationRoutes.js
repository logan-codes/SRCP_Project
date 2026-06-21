const express = require('express');
const prisma = require('../config/prismaClient');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated user, formatted for the frontend.
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_on: 'desc' }
        });

        // Format backend db keys to match expected frontend keys (message, read, createdAt)
        const formatted = notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.content,
            read: n.is_read,
            createdAt: n.created_on,
            type: n.title.toUpperCase().includes('SUPPORT') ? 'SUPPORT_TICKET' : 'SYSTEM'
        }));

        res.json(formatted);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/notifications/:id/read
 * Marks a specific notification or all notifications as read.
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            await prisma.notification.updateMany({
                where: { user_id: req.user.id, is_read: false },
                data: { is_read: true }
            });
        } else {
            const notificationId = parseInt(id, 10);
            if (isNaN(notificationId)) {
                return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
            }

            // Ensure notification belongs to the authenticated user before modifying it
            const notification = await prisma.notification.findFirst({
                where: { id: notificationId, user_id: req.user.id }
            });

            if (!notification) {
                return res.status(404).json({ success: false, message: 'Notification not found.' });
            }

            await prisma.notification.update({
                where: { id: notificationId },
                data: { is_read: true }
            });
        }

        res.json({ success: true, message: 'Notifications marked as read.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
