const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log(`[Redis] Connecting to Redis...`);

const redisClient = new Redis(redisUrl, {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: null
});

redisClient.on('connect', () => {
    console.log('[Redis] Connected to Redis successfully.');
});

redisClient.on('error', (error) => {
    console.error('[Redis] Connection error:', error);
});

module.exports = redisClient;
