const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const path = require('path');

const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// Trust proxy is required if you are behind a reverse proxy (Heroku, Render, Netlify, Nginx, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to load locally if needed
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '5mb' })); // Increased limit for bulk imports

// ─── Rate Limiting & Caching ──────────────────────────────────────────────────
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('./config/redisClient');

let limiterStore = undefined; // defaults to memory
if (redisClient) {
    limiterStore = new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    });
}

const apiLimiter = rateLimit({
    store: limiterStore,
    max: 300,
    windowMs: 15 * 60 * 1000,
    message: { message: 'Too many requests from this IP, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path.startsWith('/uploads');
    }
});

// Local static file serving removed for Serverless architecture

// ─── Routes ───────────────────────────────────────────────────────────────────
// We mount routes on a Router so they can be served both on /api (local) and /.netlify/functions/api (Netlify)
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/authRoutes'));
apiRouter.use('/upload', require('./routes/uploadRoutes'));
apiRouter.use('/projects', require('./routes/projectRoutes'));
apiRouter.use('/applications', require('./routes/applicationRoutes'));
apiRouter.use('/notifications', require('./routes/notificationRoutes'));
apiRouter.use('/teams', require('./routes/teamRoutes'));
apiRouter.use('/milestones', require('./routes/milestoneRoutes'));
apiRouter.use('/users', require('./routes/userRoutes'));
apiRouter.use('/guide', require('./routes/guideRoutes'));
apiRouter.use('/stats', require('./routes/statsRoutes'));
apiRouter.use('/global-milestones', require('./routes/globalMilestoneRoutes'));

// Apply the global API limiter to all API routes
app.use('/api', apiLimiter, apiRouter);
// Mount for Netlify Functions mapping
app.use('/.netlify/functions/api', apiLimiter, apiRouter);

// Basic health check route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the SARCG API', status: 'OK' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
