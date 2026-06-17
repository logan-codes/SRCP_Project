const redisClient = require('../config/redisClient');

const DEFAULT_EXPIRATION = 300; // 5 minutes in seconds

/**
 * Middleware to cache HTTP responses using Redis
 * @param {number} duration - Expiration time in seconds
 */
const cacheResponse = (duration = DEFAULT_EXPIRATION) => {
    return async (req, res, next) => {
        if (!redisClient) {
            // Redis not configured, bypass caching
            return next();
        }

        // Use the request URL as the cache key.
        // Include query parameters in the key for paginated routes.
        const key = `__express__${req.originalUrl || req.url}`;

        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                // If data exists in cache, send it and do not call next()
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedData));
            } else {
                res.setHeader('X-Cache', 'MISS');
                
                // Override res.json to intercept the response and cache it
                const originalSend = res.json;
                res.json = function (body) {
                    // Cache the stringified body. Do this asynchronously to not block the response
                    redisClient.setex(key, duration, JSON.stringify(body)).catch(err => {
                        console.error('Redis cache error:', err);
                    });
                    
                    // Call the original res.json
                    return originalSend.call(this, body);
                };
                
                next();
            }
        } catch (error) {
            console.error('Redis error in cache middleware:', error);
            // On error, bypass caching
            next();
        }
    };
};

module.exports = cacheResponse;
