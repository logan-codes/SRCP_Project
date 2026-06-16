const { PrismaClient } = require('@prisma/client');

// Create a single Prisma Client instance
// This prevents connection exhaustion by reusing the same connection pool across the application.
const prisma = new PrismaClient();

module.exports = prisma;
