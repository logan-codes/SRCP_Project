// Load environment variables before initializing database connection
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl
});
const adapter = new PrismaPg(pool);

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({ adapter });
} else {
    // Avoid creating multiple Prisma Client instances in dev due to hot reloading
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            adapter,
            log: ['warn', 'error']
        });
    }
    prisma = global.prisma;
}

module.exports = prisma;
