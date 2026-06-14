const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getFinalizedTeams = async (req, res) => {
    try {
        const teams = await prisma.guideTeam.findMany({
            where: {
                isFinalized: true,
                guideStatus: 'PENDING'
            },
            include: {
                leader: { select: { id: true, fullName: true, email: true } },
                members: {
                    where: { inviteStatus: 'ACCEPTED' },
                    include: { 
                        student: { 
                            select: { 
                                id: true, 
                                fullName: true, 
                                email: true,
                                studentProfile: true
                            } 
                        } 
                    }
                }
            }
        });
        res.json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching finalized teams' });
    }
};

exports.selectTeams = async (req, res) => {
    try {
        const { teamIds } = req.body;
        const facultyId = req.user.id;

        if (!Array.isArray(teamIds) || teamIds.length === 0 || teamIds.length > 2) {
            return res.status(400).json({ message: 'You must select 1 or 2 teams.' });
        }

        // Check phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'FACULTY_SELECTION') {
             return res.status(400).json({ message: 'Faculty selection phase is not active.' });
        }

        // 1. Verify faculty has selected <= 2 teams total
        const currentSelectionsCount = await prisma.facultyTeamSelection.count({
            where: {
                facultyId,
                status: { in: ['PENDING', 'ACCEPTED'] }
            }
        });

        if (currentSelectionsCount + teamIds.length > 2) {
            return res.status(400).json({ message: `You can only select up to 2 teams. You have already selected ${currentSelectionsCount}.` });
        }

        const faculty = await prisma.user.findUnique({ where: { id: facultyId } });

        // 2. Process each teamId
        for (const teamId of teamIds) {
            const team = await prisma.guideTeam.findUnique({ where: { id: teamId } });
            if (!team || !team.isFinalized || team.guideStatus !== 'PENDING') {
                return res.status(400).json({ message: `Team ${teamId} is either not finalized or already matched/selected.` });
            }

            await prisma.$transaction(async (tx) => {
                await tx.facultyTeamSelection.create({
                    data: {
                        facultyId,
                        teamId: team.id,
                        status: 'PENDING'
                    }
                });

                await tx.guideTeam.update({
                    where: { id: team.id },
                    data: { guideStatus: 'FACULTY_SELECTED' }
                });
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Guide Invitation",
                    message: `Prof. ${faculty.fullName} has selected your team "${team.teamName}" as a guide project. Accept or Reject within the portal.`,
                    type: "GUIDE_INVITE",
                    link: JSON.stringify({ teamId: team.teamId, facultyId })
                }
            });
        }

        res.status(200).json({ message: 'Teams selected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error selecting teams' });
    }
};

exports.getMySelections = async (req, res) => {
    try {
        const facultyId = req.user.id;

        const selections = await prisma.facultyTeamSelection.findMany({
            where: { facultyId },
            include: {
                team: {
                    include: {
                        leader: true,
                        members: {
                            where: { inviteStatus: 'ACCEPTED' },
                            include: { student: { include: { studentProfile: true } } }
                        }
                    }
                }
            }
        });

        res.json(selections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching selections' });
    }
};
