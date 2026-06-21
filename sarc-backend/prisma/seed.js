const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('[Seed] Starting database seeding...');

    // 1. Seed Roles with secure, non-generic, non-sequential IDs
    const adminRoleId = 98124;
    const facultyRoleId = 45312;
    const studentRoleId = 10984;

    console.log('[Seed] Seeding Roles...');
    await prisma.role.upsert({
        where: { id: adminRoleId },
        update: {},
        create: {
            id: adminRoleId,
            name: 'ADMIN',
            is_active: true
        }
    });

    await prisma.role.upsert({
        where: { id: facultyRoleId },
        update: {},
        create: {
            id: facultyRoleId,
            name: 'FACULTY',
            is_active: true
        }
    });

    await prisma.role.upsert({
        where: { id: studentRoleId },
        update: {},
        create: {
            id: studentRoleId,
            name: 'STUDENT',
            is_active: true
        }
    });

    // 2. Seed Default AppConfig TIMINGS & RATE-LIMITS
    console.log('[Seed] Seeding AppConfig constants...');
    const appConfigs = [
        { key: 'session_expiry_seconds', value: '3600' }, // 1 hour
        { key: 'session_refresh_window_seconds', value: '604800' }, // 7 days
        { key: 'rate_limit_window_ms', value: '900000' }, // 15 mins
        { key: 'rate_limit_max_requests', value: '100' }, // 100 reqs/IP
        { key: 'guide_selection_phase', value: 'CLOSED' } // CLOSED, ACTIVE
    ];

    for (const conf of appConfigs) {
        await prisma.appConfig.upsert({
            where: { key: conf.key },
            update: {},
            create: {
                key: conf.key,
                value: conf.value,
                is_active: true
            }
        });
    }

    // 3. Seed Default Admin User
    console.log('[Seed] Seeding Default Admin User...');
    const adminUsername = 'admin@sarc.ac.in';
    const adminPasswordHash = bcrypt.hashSync('admin_secure_password_123', 10);
    
    const adminUser = await prisma.user.upsert({
        where: { username: adminUsername },
        update: {},
        create: {
            username: adminUsername,
            password: adminPasswordHash,
            dob: '01-01-1990',
            role_id: adminRoleId,
            is_first_login: false,
            is_active: true
        }
    });

    // 4. Seed Placeholder "Unassigned Faculty" user (required for guide selection non-nullable team relation)
    console.log('[Seed] Seeding Unassigned Faculty placeholder...');
    const unassignedUser = await prisma.user.upsert({
        where: { username: 'unassigned_faculty' },
        update: {},
        create: {
            username: 'unassigned_faculty',
            password: bcrypt.hashSync('placeholder_password_not_for_login', 10),
            dob: '01-01-2000',
            role_id: facultyRoleId,
            is_first_login: false,
            is_active: false // Keep deactivated so it doesn't show in directories
        }
    });

    await prisma.faculty.upsert({
        where: { emp_no: 'TEMP_UNASSIGNED' },
        update: {},
        create: {
            emp_no: 'TEMP_UNASSIGNED',
            user_id: unassignedUser.id,
            name: 'Unassigned Faculty',
            mail_id: 'unassigned@sarc.ac.in',
            designation: 'Placeholder',
            department: 'None',
            total_capacity: 999,
            selection_capacity: 999,
            remaining_capacity: 999,
            is_active: false
        }
    });

    // 5. Seed Test Student & Faculty for direct testing (DOB as default passwords)
    console.log('[Seed] Seeding Test User Accounts...');
    
    // Test Student
    const studentDob = '20-10-2002';
    const studentHashedPass = bcrypt.hashSync(studentDob, 10); // DOB as default password
    const studentUser = await prisma.user.upsert({
        where: { username: 'student@sarc.ac.in' },
        update: {},
        create: {
            username: 'student@sarc.ac.in',
            password: studentHashedPass,
            dob: studentDob,
            role_id: studentRoleId,
            is_first_login: true, // triggers DOB verification and redirects to change-password
            is_active: true
        }
    });

    await prisma.student.upsert({
        where: { mail_id: 'student@sarc.ac.in' },
        update: {},
        create: {
            user_id: studentUser.id,
            name: 'Test Student',
            mail_id: 'student@sarc.ac.in',
            phone_number: '9876543210',
            section: 'A',
            department: 'Computer Science',
            year_of_study: 4,
            bio: 'Final year student looking for ML guides.',
            is_active: true
        }
    });

    // Test Faculty
    const facultyDob = '15-05-1980';
    const facultyHashedPass = bcrypt.hashSync(facultyDob, 10); // DOB as default password
    const facultyUser = await prisma.user.upsert({
        where: { username: 'faculty@sarc.ac.in' },
        update: {},
        create: {
            username: 'faculty@sarc.ac.in',
            password: facultyHashedPass,
            dob: facultyDob,
            role_id: facultyRoleId,
            is_first_login: true, // triggers DOB verification
            is_active: true
        }
    });

    await prisma.faculty.upsert({
        where: { emp_no: 'FAC_1001' },
        update: {},
        create: {
            emp_no: 'FAC_1001',
            user_id: facultyUser.id,
            name: 'Dr. Jane Smith',
            mail_id: 'faculty@sarc.ac.in',
            phone_number: '9876543211',
            designation: 'Associate Professor',
            department: 'Computer Science',
            total_capacity: 4,
            selection_capacity: 2,
            remaining_capacity: 2,
            is_active: true
        }
    });

    console.log('[Seed] Database seeding completed successfully.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('[Seed] Database seeding failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
