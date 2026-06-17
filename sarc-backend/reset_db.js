const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
    console.log('🗑️  Clearing all records...\n');

    // Delete in correct order (respecting foreign key constraints)
    await p.facultyTeamSelection.deleteMany({});
    console.log('  ✅ FacultyTeamSelections cleared');

    await p.guideTeamMember.deleteMany({});
    console.log('  ✅ GuideTeamMembers cleared');

    await p.guideTeam.deleteMany({});
    console.log('  ✅ GuideTeams cleared');

    await p.facultyGuideSlot.deleteMany({});
    console.log('  ✅ FacultyGuideSlots cleared');

    await p.notification.deleteMany({});
    console.log('  ✅ Notifications cleared');

    await p.teamMember.deleteMany({});
    console.log('  ✅ TeamMembers cleared');

    await p.team.deleteMany({});
    console.log('  ✅ Teams cleared');

    await p.milestone.deleteMany({});
    console.log('  ✅ Milestones cleared');

    await p.globalMilestone.deleteMany({});
    console.log('  ✅ GlobalMilestones cleared');

    await p.application.deleteMany({});
    console.log('  ✅ Applications cleared');

    await p.projectIdea.deleteMany({});
    console.log('  ✅ ProjectIdeas cleared');

    await p.project.deleteMany({});
    console.log('  ✅ Projects cleared');

    await p.studentProfile.deleteMany({});
    console.log('  ✅ StudentProfiles cleared');

    await p.facultyProfile.deleteMany({});
    console.log('  ✅ FacultyProfiles cleared');

    await p.industryProfile.deleteMany({});
    console.log('  ✅ IndustryProfiles cleared');

    await p.adminProfile.deleteMany({});
    console.log('  ✅ AdminProfiles cleared');

    await p.user.deleteMany({});
    console.log('  ✅ All users cleared');

    // Reset auto-increment sequences
    await p.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);
    await p.$executeRawUnsafe(`ALTER SEQUENCE "AdminProfile_id_seq" RESTART WITH 1`);
    await p.$executeRawUnsafe(`ALTER SEQUENCE "StudentProfile_id_seq" RESTART WITH 1`);
    console.log('\n  ✅ ID sequences reset to 1');

    console.log('\n👤 Creating admin account...');
    const adminHash = await bcrypt.hash('123', 10);
    const admin = await p.user.create({
        data: {
            fullName: 'System Admin',
            email: 'admin@gmail.com',
            password: adminHash,
            role: 'ADMIN',
            accountStatus: 'ACTIVE',
            isFirstLogin: false,
            failedLoginAttempts: 0,
            adminProfile: {
                create: {}
            }
        }
    });
    console.log(`  ✅ Admin created → email: admin@gmail.com | password: 123 | id: ${admin.id}`);

    console.log('\n👤 Creating student account...');
    const studentHash = await bcrypt.hash('456', 10);
    const student = await p.user.create({
        data: {
            fullName: 'Muzammil',
            email: 'phmuzammil05@gmail.com',
            password: studentHash,
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            isFirstLogin: false,
            failedLoginAttempts: 0,
            studentProfile: {
                create: {}
            }
        }
    });
    console.log(`  ✅ Student created → email: phmuzammil05@gmail.com | password: 456 | id: ${student.id}`);

    console.log('\n🎉 Done! Database is clean with 2 users:');
    console.log('   admin@gmail.com       → password: 123  → role: ADMIN');
    console.log('   phmuzammil05@gmail.com → password: 456  → role: STUDENT');
}

main().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
}).finally(() => p.$disconnect());
