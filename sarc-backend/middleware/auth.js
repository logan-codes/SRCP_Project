const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');
const redisClient = require('../config/redisClient');


/**
 * Authentication Middleware
 * Enforces JWT validation and checks database session active status.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token missing or invalid format.'
            });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'gsp_jwt_secret_key_default';
        
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        // Verify session status in Redis (Single Session & Active Check)
        const sessionData = await redisClient.get(`session:${decoded.sessionId}`);
        if (!sessionData) {
            return res.status(401).json({
                success: false,
                message: 'Session not found or expired. Please log in again.'
            });
        }

        const session = JSON.parse(sessionData);

        // Fetch current user details from DB to verify status and roles
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                role: true,
                student: true,
                faculty: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Session owner not found.'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated.'
            });
        }

        // Attach user, role, and session info to request
        req.user = user;
        req.sessionId = decoded.sessionId;
        req.userRole = user.role.name;

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Role Authorization Middleware Helper
 */
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.userRole) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required.'
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to this resource.'
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorizeRoles
};
