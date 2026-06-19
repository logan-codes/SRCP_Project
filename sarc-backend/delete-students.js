const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deleting all students...");
    const deleted = await prisma.user.deleteMany({
        where: {
            role: 'STUDENT'
        }
    });
    console.log(`Deleted ${deleted.count} students from the database.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
