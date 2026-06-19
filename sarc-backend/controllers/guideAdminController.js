const prisma = require('../config/prismaClient');
exports.getConfigAndStats = async (req, res) => {
    try {
        let config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config) {
            config = await prisma.guideSelectionConfig.create({ data: { id: 'singleton', phase: 'CLOSED' } });
        }

        const [
            totalTeams,
            teamsMatchedFaculty,
            teamsMatchedStudent,
            unmatchedTeams,
            openSlotsFacultyCount,
            facultySlots
        ] = await Promise.all([
            prisma.guideTeam.count(),
            prisma.guideTeam.count({ where: { guideStatus: 'ACCEPTED' } }),
            prisma.guideTeam.count({ where: { guideStatus: 'STUDENT_SELECTED' } }),
            prisma.guideTeam.count({ where: { guideStatus: { in: ['PENDING', 'FACULTY_SELECTED'] } } }),
            prisma.facultyGuideSlot.count({ where: { usedSlots: { lt: prisma.facultyGuideSlot.fields.totalSlots } } }),
            prisma.facultyGuideSlot.findMany({
                include: {
                    faculty: { select: { fullName: true, facultyProfile: { select: { department: true } } } }
                }
            })
        ]);

        res.json({
            config,
            stats: {
                totalTeams,
                teamsMatchedFaculty,
                teamsMatchedStudent,
                unmatchedTeams,
                openSlotsFacultyCount
            },
            facultySlots
        });

    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching config' });
    }
};

exports.changePhase = async (req, res) => {
    try {
        const { phase, dropIncompleteTeams } = req.body;
        const validPhases = ['CLOSED', 'FACULTY_SELECTION', 'STUDENT_SELECTION', 'COMPLETED'];
        
        if (!validPhases.includes(phase)) {
             return res.status(400).json({ message: 'Invalid phase' });
        }

        await prisma.$transaction(async (tx) => {
             await tx.guideSelectionConfig.upsert({
                 where: { id: 'singleton' },
                 update: { phase },
                 create: { id: 'singleton', phase }
             });

             if (phase === 'FACULTY_SELECTION') {
                 // Finalize teams
                 const allTeams = await tx.guideTeam.findMany({
                     include: { members: true }
                 });

                 const teamsToDeleteIds = [];
                 const teamsToClearPendingIds = [];

                 for (const team of allTeams) {
                     const hasPending = team.members.some(m => m.inviteStatus === 'PENDING');

                     if (team.isFinalized) {
                          if (hasPending) {
                              if (dropIncompleteTeams) {
                                   teamsToDeleteIds.push(team.id);
                              } else {
                                   teamsToClearPendingIds.push(team.id);
                              }
                          }
                     } else {
                          // Team is not finalized by Admin. If phase moves to faculty selection, we can choose to delete unfinalized teams
                          if (dropIncompleteTeams) {
                              teamsToDeleteIds.push(team.id);
                          }
                     }
                 }

                 // Bulk operations instead of sequential awaits
                 if (teamsToClearPendingIds.length > 0) {
                     await tx.guideTeamMember.deleteMany({
                         where: { teamId: { in: teamsToClearPendingIds }, inviteStatus: 'PENDING' }
                     });
                 }

                 if (teamsToDeleteIds.length > 0) {
                     const teamsToDelete = await tx.guideTeam.findMany({
                         where: { id: { in: teamsToDeleteIds } }
                     });
                     for (const team of teamsToDelete) {
                         if (team.guideId) {
                             await tx.facultyGuideSlot.update({
                                 where: { facultyId: team.guideId },
                                 data: { usedSlots: { decrement: 1 } }
                             });
                         }
                     }

                     await tx.guideTeamMember.deleteMany({ where: { teamId: { in: teamsToDeleteIds } } });
                     await tx.guideTeam.deleteMany({ where: { id: { in: teamsToDeleteIds } } });
                 }

                 // Ensure all faculty have a slot record using bulk createMany
                 const allFaculty = await tx.user.findMany({ where: { role: 'FACULTY' } });
                 const existingSlots = await tx.facultyGuideSlot.findMany();
                 const existingFacultyIds = existingSlots.map(s => s.facultyId);
                 
                 const newSlotsToCreate = allFaculty
                     .filter(fac => !existingFacultyIds.includes(fac.id))
                     .map(fac => ({ facultyId: fac.id, totalSlots: 7, usedSlots: 0 }));

                 if (newSlotsToCreate.length > 0) {
                     await tx.facultyGuideSlot.createMany({
                         data: newSlotsToCreate
                     });
                 }
             }
        });

        res.json({ message: `Phase changed to ${phase}` });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error changing phase' });
    }
};

exports.updateFacultySlot = async (req, res) => {
    try {
         const { facultyId } = req.params;
         const { totalSlots } = req.body;

         await prisma.facultyGuideSlot.update({
             where: { facultyId: parseInt(facultyId) },
             data: { totalSlots: parseInt(totalSlots) }
         });

         res.json({ message: 'Faculty slot updated successfully' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error updating faculty slot' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const teams = await prisma.guideTeam.findMany({
            where: {
                guideId: { not: null }
            },
            include: {
                leader: { select: { fullName: true, studentProfile: { select: { studentId: true } } } },
                guide: {
                    select: {
                        fullName: true,
                        facultyProfile: { select: { designation: true, department: true } }
                    }
                },
                members: {
                    where: { inviteStatus: 'ACCEPTED', isLeader: false },
                    include: {
                        student: { select: { fullName: true, studentProfile: { select: { studentId: true } } } }
                    }
                }
            },
            orderBy: { teamId: 'asc' }
        });
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching dashboard' });
    }
};

exports.getAllTeams = async (req, res) => {
    try {
        const teams = await prisma.guideTeam.findMany({
            include: {
                leader: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true } } } },
                members: {
                    include: {
                        student: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true } } } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error fetching all teams' });
    }
};

exports.toggleTeamFinalization = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { isFinalized } = req.body;

        const updatedTeam = await prisma.guideTeam.update({
            where: { id: teamId },
            data: { isFinalized }
        });

        res.json({ message: `Team finalization set to ${isFinalized}`, team: updatedTeam });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error toggling team finalization' });
    }
};

exports.finalizeAllTeams = async (req, res) => {
    try {
        const teams = await prisma.guideTeam.findMany({
            include: { members: true }
        });

        let finalizedCount = 0;
        await prisma.$transaction(async (tx) => {
            for (const team of teams) {
                const acceptedCount = team.members.filter(m => m.inviteStatus === 'ACCEPTED').length;
                // Only finalize teams with 1 or 2 accepted members
                if (acceptedCount >= 1 && acceptedCount <= 2 && !team.isFinalized) {
                    await tx.guideTeam.update({
                        where: { id: team.id },
                        data: { isFinalized: true }
                    });
                    finalizedCount++;
                }
            }
        });

        res.json({ message: `Successfully finalized ${finalizedCount} ready teams.` });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error finalizing all teams' });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        await prisma.$transaction(async (tx) => {
            const team = await tx.guideTeam.findUnique({ where: { id: teamId } });
            if (team && team.guideId) {
                await tx.facultyGuideSlot.update({
                    where: { facultyId: team.guideId },
                    data: { usedSlots: { decrement: 1 } }
                });
            }

            await tx.guideTeamMember.deleteMany({ where: { teamId } });
            await tx.facultyTeamSelection.deleteMany({ where: { teamId } });
            await tx.guideTeam.delete({ where: { id: teamId } });
        });

        res.json({ message: 'Team successfully deleted.' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error deleting team' });
    }
};

exports.resetPhase = async (req, res) => {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete all GuideTeamMembers
            await tx.guideTeamMember.deleteMany({});
            
            // Delete all FacultyTeamSelections
            await tx.facultyTeamSelection.deleteMany({});
            
            // Delete all GuideTeams
            await tx.guideTeam.deleteMany({});
            
            // Reset all FacultyGuideSlots
            await tx.facultyGuideSlot.updateMany({
                data: { usedSlots: 0 }
            });
            
            // Reset phase to CLOSED
            await tx.guideSelectionConfig.upsert({
                where: { id: 'singleton' },
                update: { phase: 'CLOSED' },
                create: { id: 'singleton', phase: 'CLOSED' }
            });
        });

        res.json({ message: 'Guide Selection phase has been completely restarted. All data wiped.' });
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error resetting phase' });
    }
};

exports.exportTeams = async (req, res) => {
    try {
        const teams = await prisma.guideTeam.findMany({
            where: {
                guideId: { not: null },
                isFinalized: true
            },
            include: {
                leader: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true, department: true } } } },
                guide: { select: { fullName: true, email: true, facultyProfile: { select: { department: true, designation: true } } } },
                members: {
                    where: { inviteStatus: 'ACCEPTED', isLeader: false },
                    include: {
                        student: { select: { fullName: true, email: true, studentProfile: { select: { studentId: true } } } }
                    }
                }
            },
            orderBy: { teamId: 'asc' }
        });
        
        res.json(teams);
    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ message: 'Server error exporting teams' });
    }
};
