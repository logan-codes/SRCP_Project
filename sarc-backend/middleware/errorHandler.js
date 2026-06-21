/**
 * Centralized Error Handling Middleware
 * Converts database, validation, and operational errors into structured client responses.
 */
function errorHandler(err, req, res, next) {
    // Log the error for internal diagnostics (avoid logging sensitive payloads in production)
    console.error(`[Error] [${req.method} ${req.url}]`, err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Prisma Client errors
    if (err.code) {
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                statusCode = 409;
                const fields = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
                message = `A record with this ${fields} already exists.`;
                break;
            case 'P2003': // Foreign key constraint violation
                statusCode = 400;
                message = 'Associated reference record was not found.';
                break;
            case 'P2025': // Record not found
                statusCode = 404;
                message = err.meta && err.meta.cause ? err.meta.cause : 'Requested record was not found.';
                break;
            default:
                statusCode = 400;
                message = 'Database query operation failed.';
                break;
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token expired.';
    }

    // Send uniform JSON response
    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;
