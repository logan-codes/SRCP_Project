const prisma = require('../config/prismaClient');
exports.getPortalStats = async (req, res) => {
    try {
        const activeProjects = await prisma.project.count({ where: { status: 'OPEN' } });
        const facultyCount = await prisma.user.count({ where: { role: 'FACULTY' } });
        const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
        const industryCount = await prisma.user.count({ where: { role: 'INDUSTRY' } });

        res.json({
            activeProjects,
            facultyResearchers: facultyCount,
            studentCollaborators: studentCount,
            industryMentors: industryCount
        });
    } catch (err) {
        console.error("GET STATS ERROR:", err.message);
        res.status(500).send('Server error');
    }
};
