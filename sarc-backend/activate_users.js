const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Set all existing users to ACTIVE so they can login
    const result = await p.user.updateMany({
        data: {
            accountStatus: 'ACTIVE',
            isFirstLogin: false,
        }
    });
    console.log(`✅ Updated ${result.count} users → accountStatus: ACTIVE, isFirstLogin: false`);
    console.log('All accounts are now ready to login.');
}

main().catch(e => console.error('Error:', e.message)).finally(() => p.$disconnect());
