const app = require('./app');
const prisma = require('./config/prismaClient');

// ─── Notification Cleanup Job ──────────────────────────────────────────────────
// Runs every hour to delete notifications older than 2 days
setInterval(async () => {
    try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: twoDaysAgo
                }
            }
        });
        
        if (result.count > 0) {
            console.log(`[Cleanup] Deleted ${result.count} old notifications.`);
        }
    } catch (err) {
        console.error('[Cleanup Error] Failed to delete old notifications:', err);
    }
}, 60 * 60 * 1000); // 1 hour interval

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | PID: ${process.pid}`);
});
