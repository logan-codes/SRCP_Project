const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const facultyId = 2;
  const allocatedTeams = await prisma.guideTeam.findMany({
      where: {
          guideId: facultyId,
          guideStatus: { in: ['STUDENT_SELECTED', 'ACCEPTED'] }
      },
      include: {
          leader: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true } } } },
          members: {
              where: { inviteStatus: 'ACCEPTED', isLeader: false },
              include: {
                  student: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true } } } }
              }
          }
      }
  });
  console.log(JSON.stringify(allocatedTeams, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
