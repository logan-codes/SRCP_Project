const { PrismaClient } = require('@prisma/client');

// ─── Connection Pool Configuration ────────────────────────────────────────────
// PostgreSQL has a default max of 100 connections.
// With PM2 cluster mode (e.g., 4 workers), each worker gets its own pool.
// Formula: connection_limit = Math.floor(postgres_max_connections / num_workers)
// Set DATABASE_URL with ?connection_limit=N to control per-process pool size.
// Example for 4 PM2 workers: ?connection_limit=20&pool_timeout=20
//
// If you do not set ?connection_limit in DATABASE_URL, Prisma defaults to:
//   - 2 + (num_cpus * 2) connections per process (usually ~10-18 per worker)
//
// Explicitly set here for predictability across environments.

const prismaClientSingleton = () => {
    return new PrismaClient({
        // Log only warnings and errors in production to avoid I/O overhead.
        log: process.env.NODE_ENV === 'development'
            ? ['warn', 'error']
            : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

// Use a global variable to cache the Prisma Client instance in serverless and dev environments
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

// Graceful shutdown: disconnect Prisma on process exit to release DB connections.
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = prisma;
