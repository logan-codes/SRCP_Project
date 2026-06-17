const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const compression = require('compression');
const hpp = require('hpp');

dotenv.config();

const app = express();
const path = require('path');

const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

// Performance Middleware
app.use(compression()); // Compress all responses

// Security Middleware
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to load locally if needed
// app.use(xss()); // Prevent XSS attacks (incompatible with Express 5)
// app.use(hpp()); // Prevent HTTP Parameter Pollution (incompatible with Express 5)
app.use(express.json({ limit: '5mb' })); // Increased limit for bulk imports

// Global Rate Limiting
const globalLimiter = rateLimit({
    max: 1000, // 1000 requests per 15 mins
    windowMs: 15 * 60 * 1000,
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter); // Apply to all API routes

// Rate Limiting (Brute Force Protection for Auth)
const authLimiter = rateLimit({
    max: 100, // 100 login attempts per 15 mins
    windowMs: 15 * 60 * 1000,
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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

// Basic Route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the SARCG API' });
});

// Global error handler to ensure JSON responses
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    
    // Check if headers have already been sent to the client
    if (res.headersSent) {
        return next(err);
    }
    
    // Send JSON response
    res.status(err.status || 500).json({ 
        message: err.message || 'Internal Server Error' 
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
