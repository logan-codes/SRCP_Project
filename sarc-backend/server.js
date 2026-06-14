const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const path = require('path');

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to load locally if needed
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Prevent payload exhaustion

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
