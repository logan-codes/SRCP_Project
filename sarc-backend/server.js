const app = require('./app');
const prisma = require('./config/prismaClient');
const redisClient = require('./config/redisClient');


const PORT = process.env.PORT || 5000;
const RUN_MODE = process.env.RUN_MODE || 'standalone';

// Check if we should skip listening (e.g. when building, testing serverless imports, or deployed on Netlify)
const isServerless = RUN_MODE === 'serverless' || process.env.NETLIFY === 'true';

let server;

if (!isServerless) {
    server = app.listen(PORT, () => {
        console.log(`[Server] GSP Backend running in '${RUN_MODE}' mode on port ${PORT}`);
    });
} else {
    console.log(`[Server] GSP Backend loaded in serverless wrapper. Standalone listener bypassed.`);
}

// Graceful shutdown handling
const shutdown = async () => {
    console.log('\n[Server] Shutting down gracefully...');
    if (server) {
        server.close(() => {
            console.log('[Server] HTTP server closed.');
        });
    }
    
    try {
        await prisma.$disconnect();
        console.log('[Server] Database connection disconnected.');
    } catch (err) {
        console.error('[Server] Error disconnecting database during shutdown:', err);
    }

    try {
        await redisClient.quit();
        console.log('[Server] Redis connection disconnected.');
    } catch (err) {
        console.error('[Server] Error disconnecting Redis during shutdown:', err);
    }

    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
