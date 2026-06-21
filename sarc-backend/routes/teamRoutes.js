const express = require('express');
const prisma = require('../config/prismaClient');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper to get team metadata from AppConfig
 */
async function getTeamMetadata(teamId) {
    const key = `team_metadata_${teamId}`;
    const config = await prisma.appConfig.findUnique({ where: { key } });
    if (config) {
        try {
            return JSON.parse(config.value);
        } catch {
            // fallback
        }
    }
    return {
        description: '',
        guideStatus: 'PENDING',
        isFinalized: false,
        abstractFile: null
    };
}

/**
 * GET /api/teams
 * Fetches all active collaboration teams.
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const teams = await prisma.team.findMany({
            where: { is_active: true },
            include: {
                domain: true,
                faculty: true,
                members: {
                    include: {
                        student: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        const formattedTeams = [];
        for (const team of teams) {
            const metadata = await getTeamMetadata(team.id);
            const leaderMember = team.members.find(m => m.role === 'LEADER');

            // Format for frontend TeamFormation card
            formattedTeams.push({
                id: team.id,
                name: `Team ${team.id} - ${team.project_title}`,
                description: metadata.description || 'No description provided.',
                status: metadata.isFinalized ? 'FINALIZED' : 'OPEN',
                project: {
                    title: team.project_title
                },
                leaderId: leaderMember ? leaderMember.student_id : null,
                leader: leaderMember ? {
                    id: leaderMember.student.id,
                    user: {
                        fullName: leaderMember.student.name
                    }
                } : null,
                members: team.members.map(m => ({
                    id: m.id,
                    studentId: m.student_id,
                    student: {
                        user: {
                            fullName: m.student.name
                        }
                    }
                }))
            });
        }

        res.json(formattedTeams);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/teams/:teamId/join
 * Adds the student user to a collaboration team.
 */
router.post('/:teamId/join', authenticate, async (req, res, next) => {
    try {
        const teamId = parseInt(req.params.teamId, 10);
        
        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        if (!student) {
            return res.status(400).json({ success: false, message: 'Only students can join teams.' });
        }

        // Check if student is already in a team
        const inTeam = await prisma.teamMember.findFirst({
            where: { student_id: student.id }
        });
        if (inTeam) {
            return res.status(400).json({ success: false, message: 'You are already in a team.' });
        }

        // Check if the team exists and has space
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { members: true }
        });

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }

        const metadata = await getTeamMetadata(teamId);
        if (metadata.isFinalized || team.members.length >= 2) {
            return res.status(400).json({ success: false, message: 'This team is already full or finalized.' });
        }

        // Add to team members
        await prisma.teamMember.create({
            data: {
                team_id: teamId,
                student_id: student.id,
                role: 'MEMBER'
            }
        });

        // Automatically finalize if count reaches 2
        if (team.members.length + 1 >= 2) {
            metadata.isFinalized = true;
            await saveTeamMetadata(teamId, metadata);
        }

        res.json({ success: true, message: 'Joined the team successfully.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
