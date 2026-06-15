const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const skip = 0;
    const take = 20;
    const whereClause = { role: 'STUDENT' };
    
    try {
        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    studentProfile: { select: { department: true, batch: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.user.count({ where: whereClause })
        ]);
        
        console.log('Total:', total);
        console.log('Users count:', users.length);
        if (users.length > 0) {
            console.log('First user:', users[0]);
        }
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
