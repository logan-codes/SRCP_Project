const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load envs
dotenv.config();

// Initialize Express app
const app = express();

// Security middlewares
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Custom Middleware
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Apply rate limiting to all API requests
app.use('/api/', rateLimiter);

// Import Routers
const authRoutes = require('./routes/authRoutes');
const guideRoutes = require('./routes/guideRoutes');
const teamRoutes = require('./routes/teamRoutes');
const systemRoutes = require('./routes/systemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', systemRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Centralized error handler (must be registered last)
app.use(errorHandler);

module.exports = app;