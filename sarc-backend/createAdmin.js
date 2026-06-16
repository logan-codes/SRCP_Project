const bcrypt = require('bcryptjs');

const prisma = require('./config/prismaClient');
async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];
    const fullName = process.argv[4] || 'System Admin';

    if (!email || !password) {
        console.error('Usage: node createAdmin.js <email> <password> [fullName]');
        process.exit(1);
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.error('Error: A user with this email already exists.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: 'ADMIN',
                adminProfile: {
                    create: {
                        department: 'System Administration'
                    }
                }
            }
        });

        console.log(`\nSUCCESS! Admin created successfully:`);
        console.log(`Email: ${newAdmin.email}`);
        console.log(`Name: ${newAdmin.fullName}`);
        console.log(`Role: ${newAdmin.role}`);
        console.log(`\nYou can now log in using these credentials.`);
    } catch (error) {
        console.error('Failed to create admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
