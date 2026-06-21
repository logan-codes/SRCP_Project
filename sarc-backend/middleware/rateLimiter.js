const prisma = require('../config/prismaClient');
const redisClient = require('../config/redisClient');


// Configuration cache to avoid hitting DB on every request
let configCache = null;
let lastFetchedTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

/**
 * Loads rate limit configuration from AppConfig database table.
 */
async function loadRateLimitConfig() {
    const now = Date.now();
    if (configCache && (now - lastFetchedTime < CACHE_TTL)) {
        return configCache;
    }

    try {
        const configs = await prisma.appConfig.findMany({
            where: {
                key: {
                    in: ['rate_limit_window_ms', 'rate_limit_max_requests']
                },
                is_active: true
            }
        });

        const configMap = {};
        configs.forEach(c => {
            configMap[c.key] = parseInt(c.value, 10);
        });

        configCache = {
            windowMs: configMap['rate_limit_window_ms'] || 15 * 60 * 1000, // 15 mins default
            max: configMap['rate_limit_max_requests'] || 100 // 100 requests default
        };
        lastFetchedTime = now;
    } catch (error) {
        console.error('Failed to load rate limit config from DB, using defaults:', error);
        configCache = {
            windowMs: 15 * 60 * 1000,
            max: 100
        };
    }

    return configCache;
}

/**
 * Dynamic Rate Limiter Middleware
 */
async function rateLimiter(req, res, next) {
    try {
        const config = await loadRateLimitConfig();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `rate_limit:${ip}`;

        const requests = await redisClient.incr(key);

        if (requests === 1) {
            await redisClient.expire(key, Math.ceil(config.windowMs / 1000));
        } else {
            // Defensive check: ensure key has TTL
            const ttl = await redisClient.ttl(key);
            if (ttl === -1) {
                await redisClient.expire(key, Math.ceil(config.windowMs / 1000));
            }
        }

        if (requests > config.max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        next();
    } catch (error) {
        console.error('[RateLimiter] Redis rate limiting error:', error);
        // Fail-open to avoid locking out users on Redis connection issues
        next();
    }
}

module.exports = rateLimiter;
