const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const selections = await prisma.facultyTeamSelection.findMany();
    console.log(selections);
    const team = await prisma.guideTeam.findUnique({ where: { teamName: 'coder' } });
    console.log(team);
}

main().finally(() => prisma.$disconnect());
