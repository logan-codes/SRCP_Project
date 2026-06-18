const { schedule } = require('@netlify/functions');
const prisma = require('../../config/prismaClient');

// Run every hour at minute 0
exports.handler = schedule('0 * * * *', async (event) => {
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
        
        console.log(`[Scheduled Cleanup] Deleted ${result.count} old notifications.`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Deleted ${result.count} old notifications.` })
        };
    } catch (err) {
        console.error('[Scheduled Cleanup Error] Failed to delete old notifications:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to run cleanup' })
        };
    }
});
