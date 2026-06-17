const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const compression = require('compression');

dotenv.config();

const app = express();
const path = require('path');

const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// ─── Response Compression ────────────────────────────────────────────────────
// Compresses all JSON responses with gzip. Reduces payload size by ~60-80%.
// Only compresses responses > 1KB to avoid overhead on tiny responses.
app.use(compression({ threshold: 1024 }));

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(xss());
app.use(express.json({ limit: '5mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Strict limiter for auth routes (prevents brute-force attacks)
const authLimiter = rateLimit({
    max: 20,
    windowMs: 15 * 60 * 1000,
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General limiter for all other API routes (prevents abuse / DDoS)
const apiLimiter = rateLimit({
    max: 300,              // 300 requests per 15 minutes per IP
    windowMs: 15 * 60 * 1000,
    message: { message: 'Too many requests from this IP, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for static file requests (uploads)
        return req.path.startsWith('/uploads');
    }
});

// Apply limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    // Cache static files for 1 day in the browser to reduce repeat requests
    maxAge: '1d',
    etag: true,
    lastModified: true,
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/guide', require('./routes/guideRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/global-milestones', require('./routes/globalMilestoneRoutes'));

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

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | PID: ${process.pid}`);
});
