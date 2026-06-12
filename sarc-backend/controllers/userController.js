const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Get all faculty profiles (Public Directory)
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await prisma.facultyProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhoto: true
                        // Exclude email and password
                    }
                },
                projects: {
                    where: { status: 'OPEN' },
                    select: { id: true, title: true, domain: true, status: true }
                }
            }
        });
        
        // Filter out personal details before sending
        const sanitizedFaculty = faculty.map(f => ({
            id: f.id,
            userId: f.userId,
            fullName: f.user.fullName,
            profilePhoto: f.user.profilePhoto,
            department: f.department,
            designation: f.designation,
            researchAreas: f.researchAreas,
            skills: f.skills,
            bio: f.bio,
            projects: f.projects
            // Explicitly OMITTING contactNumber, linkedin, email
        }));

        res.json(sanitizedFaculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get single faculty profile
exports.getFacultyById = async (req, res) => {
    try {
        const faculty = await prisma.facultyProfile.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePhoto: true
                        // Exclude email
                    }
                },
                projects: {
                    select: { id: true, title: true, domain: true, status: true, description: true, skillsRequired: true }
                }
            }
        });

        if (!faculty) return res.status(404).json({ message: "Faculty not found" });

        // Filter out personal details
        const sanitizedFaculty = {
            id: faculty.id,
            userId: faculty.userId,
            fullName: faculty.user.fullName,
            profilePhoto: faculty.user.profilePhoto,
            department: faculty.department,
            designation: faculty.designation,
            researchAreas: faculty.researchAreas,
            skills: faculty.skills,
            bio: faculty.bio,
            projects: faculty.projects
            // Explicitly OMITTING contactNumber, linkedin, email
        };

        res.json(sanitizedFaculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                studentProfile: { select: { department: true, yearOfStudy: true } },
                facultyProfile: { select: { department: true, designation: true } },
                adminProfile: { select: { department: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Create user
exports.createUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const { fullName, email, password, role } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: role || 'STUDENT'
            },
            select: { id: true, fullName: true, email: true, role: true, createdAt: true }
        });
        
        // Create profile associated with user
        const prismaRole = role || 'STUDENT';
        if (prismaRole === 'STUDENT') {
            await prisma.studentProfile.create({ data: { userId: newUser.id } });
        } else if (prismaRole === 'FACULTY') {
            await prisma.facultyProfile.create({ data: { userId: newUser.id } });
        } else if (prismaRole === 'INDUSTRY') {
            await prisma.industryProfile.create({ data: { userId: newUser.id } });
        } else if (prismaRole === 'ADMIN') {
            await prisma.adminProfile.create({ data: { userId: newUser.id } });
        }
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Bulk Create Users
exports.bulkCreateUsers = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const { users } = req.body;
        if (!users || !Array.isArray(users)) return res.status(400).json({ message: 'Invalid payload' });

        let createdCount = 0;
        let errors = [];

        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            try {
                const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
                if (existingUser) {
                    errors.push({ email: u.email, message: 'Email already exists' });
                    continue;
                }
                
                const hashedPassword = await bcrypt.hash(u.password || 'password123', 10);
                const prismaRole = u.role || 'STUDENT';
                
                const newUser = await prisma.user.create({
                    data: {
                        fullName: u.fullName,
                        email: u.email,
                        password: hashedPassword,
                        role: prismaRole
                    }
                });
                
                if (prismaRole === 'STUDENT') {
                    await prisma.studentProfile.create({ data: { userId: newUser.id, department: u.department, yearOfStudy: u.yearOfStudy } });
                } else if (prismaRole === 'FACULTY') {
                    await prisma.facultyProfile.create({ data: { userId: newUser.id, department: u.department, designation: u.designation } });
                } else if (prismaRole === 'INDUSTRY') {
                    await prisma.industryProfile.create({ data: { userId: newUser.id } });
                } else if (prismaRole === 'ADMIN') {
                    await prisma.adminProfile.create({ data: { userId: newUser.id, department: u.department } });
                }
                createdCount++;
            } catch (err) {
                errors.push({ email: u.email, message: err.message });
            }
        }
        
        res.status(201).json({ message: `Created ${createdCount} users`, createdCount, errors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const { id } = req.params;
        const { fullName, email, role, password } = req.body;
        
        const updateData = { fullName, email, role };
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, fullName: true, email: true, role: true, createdAt: true }
        });
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') return res.status(400).json({ message: 'Email already exists' });
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
        
        const { id } = req.params;
        
        // Let Prisma's cascade delete handle related records
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin: Analytics
exports.getAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const totalUsers = await prisma.user.count();
        const activeProjects = await prisma.project.count({
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        });

        // Compute success rate (e.g. % of finalized teams)
        const totalTeams = await prisma.guideTeam.count();
        const finalizedTeams = await prisma.guideTeam.count({ where: { isFinalized: true } });
        const successRate = totalTeams > 0 ? Math.round((finalizedTeams / totalTeams) * 100) : 0;

        const systemAlerts = await prisma.notification.count({ where: { read: false, type: 'ALERT' } });

        // Department data based on Student Profiles
        const deptGroup = await prisma.studentProfile.groupBy({
            by: ['department'],
            _count: { department: true },
            where: { department: { not: null } }
        });

        const departmentData = deptGroup.map(d => ({
            name: d.department || 'Unknown',
            projects: d._count.department
        })).sort((a, b) => b.projects - a.projects).slice(0, 5);

        // Participation Data
        const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
        const activeStudents = await prisma.guideTeamMember.count({
            where: { inviteStatus: 'ACCEPTED' }
        });

        const participationData = [
            { name: 'Active Students', value: activeStudents, color: '#800000' },
            { name: 'Inactive/Browsing', value: Math.max(0, totalStudents - activeStudents), color: '#FFD700' },
        ];

        // Recent Flags (mocked for now as we don't have a moderation table)
        const recentFlags = [];

        res.json({
            stats: {
                totalUsers,
                activeProjects,
                successRate: `${successRate}%`,
                systemAlerts
            },
            departmentData,
            participationData,
            recentFlags
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching analytics" });
    }
};

