const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, include: { studentProfile: true } });
    console.log(students[0]);
}

main().finally(() => prisma.$disconnect());
