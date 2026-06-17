const Redis = require('ioredis');

let redisClient = null;

if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Connected to Redis'));
} else {
    console.warn('REDIS_URL is not set. Running without Redis caching and rate-limiting using memory instead.');
}

module.exports = redisClient;
