const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');
const { authenticate } = require('../middleware/auth');
const redisClient = require('../config/redisClient');
const crypto = require('crypto');


const router = express.Router();

// JWT Secrets and default durations
const JWT_SECRET = process.env.JWT_SECRET || 'gsp_jwt_secret_key_default';

/**
 * Utility to fetch configuration value
 */
async function getConfig(key, defaultValue) {
    try {
        const config = await prisma.appConfig.findUnique({
            where: { key }
        });
        return config && config.is_active ? config.value : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * POST /api/auth/login
 * Authenticates user, revokes previous sessions, and issues new tokens.
 */
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if ( !username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        // 1. Locate user via Username
        const dbUser = await prisma.user.findFirst({
            where: {
                is_active: true,
                username: username
            },
            include: {
                role: true,
                student: true,
                faculty: true
            }
        });

        const user = dbUser;
        const student = dbUser?.student;
        const faculty = dbUser?.faculty;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 2. Check Lockout status
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`
            });
        }

        // 3. Authenticate password (support DOB as password if is_first_login is true)
        let isMatch = false;
        if (user.is_first_login) {
            // Check DOB raw match OR bcrypt match
            if (password === user.dob || bcrypt.compareSync(password, user.password)) {
                isMatch = true;
            }
        } else {
            isMatch = bcrypt.compareSync(password, user.password);
        }
        const no_of_retries = parseInt(await getConfig("no_of_retries",5))
        const retry_duration = parseInt(await getConfig("retry_duration_minutes",15))

        if (!isMatch) {
            // Handle failed attempt counters
            const failedAttempts = user.failed_login_attempts + 1;
            const updates = { failed_login_attempts: failedAttempts };
            
            if (failedAttempts >= no_of_retries) {
                // Lock account for 15 minutes
                updates.locked_until = new Date(Date.now() + retry_duration * 60 * 1000);
                updates.failed_login_attempts = 0; // reset counter after locking
            }

            await prisma.user.update({
                where: { id: user.id },
                data: updates
            });

            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Reset failed attempts on success
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failed_login_attempts: 0,
                locked_until: null,
                last_active_at: new Date()
            }
        });

        // 4. Enforce Single Active Session (Revoke old sessions in Redis)
        const userSessionKey = `user:session:${user.id}`;
        const oldSessionId = await redisClient.get(userSessionKey);
        if (oldSessionId) {
            await redisClient.del(`session:${oldSessionId}`);
        }

        // 5. Generate Session and tokens using AppConfig durations
        const expirySec = parseInt(await getConfig('session_expiry_seconds', '3600'), 10);
        const refreshSec = parseInt(await getConfig('session_refresh_window_seconds', '604800'), 10); // 7 days default

        const sessionId = crypto.randomUUID();
        const sessionData = JSON.stringify({ userId: user.id });

        // Save new session in Redis with TTL matching the refresh window
        await redisClient.set(`session:${sessionId}`, sessionData, 'EX', refreshSec);
        await redisClient.set(userSessionKey, sessionId, 'EX', refreshSec);

        const accessToken = jwt.sign(
            { userId: user.id, sessionId: sessionId, role: user.role.name },
            JWT_SECRET,
            { expiresIn: `${expirySec}s` }
        );

        const refreshToken = jwt.sign(
            { sessionId: sessionId },
            JWT_SECRET,
            { expiresIn: `${refreshSec}s` }
        );

        // Determine profile full name
        let fullName = user.username;
        if (student) fullName = student.name;
        else if (faculty) fullName = faculty.name;

        res.json({
            success: true,
            token: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.id,
                username: user.username,
                fullName: fullName,
                role: user.role.name,
                isFirstLogin: user.is_first_login
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh-token
 * Validates and issues a new access token if session is within its refresh window.
 */
router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
        }

        // Check if session exists in Redis
        const sessionData = await redisClient.get(`session:${decoded.sessionId}`);
        if (!sessionData) {
            return res.status(401).json({ success: false, message: 'Session is expired or revoked. Please log in again.' });
        }

        const session = JSON.parse(sessionData);

        // Fetch user from database to ensure they are active and get their role
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { role: true }
        });

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, message: 'User is inactive or not found.' });
        }

        // Session is valid, issue new access token
        const expirySec = parseInt(await getConfig('session_expiry_seconds', '3600'), 10);
        const newAccessToken = jwt.sign(
            { userId: user.id, sessionId: decoded.sessionId, role: user.role.name },
            JWT_SECRET,
            { expiresIn: `${expirySec}s` }
        );

        res.json({
            success: true,
            token: newAccessToken
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Revokes current session.
 */
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        // Delete the session and the user mapping from Redis
        await redisClient.del(`session:${req.sessionId}`);
        await redisClient.del(`user:session:${req.user.id}`);
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Retrieves authenticated user details.
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        // req.user has already been fetched and populated in auth middleware!
        const user = req.user;
        const role = user.role.name;

        const responseData = {
            id: user.id,
            username: user.username,
            role: role,
            isFirstLogin: user.is_first_login,
            createdOn: user.created_on,
            lastActiveAt: user.last_active_at
        };

        if (role === 'STUDENT' && user.student) {
            responseData.fullName = user.student.name;
            responseData.email = user.student.mail_id;
            responseData.studentProfile = {
                studentId: user.student.id,
                section: user.student.section,
                phoneNumber: user.student.phone_number,
                socials: user.student.socials,
                department: user.student.department,
                yearOfStudy: user.student.year_of_study,
                bio: user.student.bio
            };
        } else if (role === 'FACULTY' && user.faculty) {
            responseData.fullName = user.faculty.name;
            responseData.email = user.faculty.mail_id;
            responseData.facultyProfile = {
                facultyId: user.faculty.id,
                empNo: user.faculty.emp_no,
                phoneNumber: user.faculty.phone_number,
                designation: user.faculty.designation,
                department: user.faculty.department,
                profilePhoto: user.faculty.profile_photo,
                totalCapacity: user.faculty.total_capacity,
                selectionCapacity: user.faculty.selection_capacity,
                remainingCapacity: user.faculty.remaining_capacity
            };
        }

        res.json(responseData);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/auth/profile
 * Updates user profile details.
 */
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const role = user.role.name;
        const body = req.body;

        if (role === 'STUDENT' && user.student) {
            const updatedStudent = await prisma.student.update({
                where: { id: user.student.id },
                data: {
                    name: body.fullName || user.student.name,
                    phone_number: body.phoneNumber || user.student.phone_number,
                    bio: body.bio || user.student.bio,
                    socials: body.socials || user.student.socials,
                    section: body.section || user.student.section
                }
            });
            return res.json({ success: true, student: updatedStudent });
        } else if (role === 'FACULTY' && user.faculty) {
            const updatedFaculty = await prisma.faculty.update({
                where: { id: user.faculty.id },
                data: {
                    name: body.fullName || user.faculty.name,
                    phone_number: body.phoneNumber || user.faculty.phone_number,
                    designation: body.designation || user.faculty.designation,
                    department: body.department || user.faculty.department,
                    profile_photo: body.profilePhoto || user.faculty.profile_photo
                }
            });
            return res.json({ success: true, faculty: updatedFaculty });
        }

        res.status(400).json({ success: false, message: 'Invalid profile operation.' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/force-change-password
 * Changes password and sets is_first_login to false.
 */
router.post('/force-change-password', authenticate, async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                password: hashedPassword,
                is_first_login: false
            }
        });

        res.json({
            success: true,
            message: 'Password updated successfully.'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
