const prisma = require('../config/prismaClient');
exports.createTeam = async (req, res) => {
    try {
        const { teamName, projectTitle, description, domain } = req.body;
        const studentId = req.user.id; // from auth middleware

        if (!teamName || !projectTitle || !description || !domain) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if config phase is CLOSED
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        // 1. Check student is not already in any GuideTeam (as leader or ACCEPTED member)
        const existingLeadership = await prisma.guideTeam.findFirst({ where: { leaderId: studentId } });
        if (existingLeadership) {
            return res.status(400).json({ message: 'You are already a leader of a team.' });
        }

        const existingMembership = await prisma.guideTeamMember.findFirst({
            where: {
                studentId,
                inviteStatus: 'ACCEPTED'
            }
        });
        if (existingMembership) {
            return res.status(400).json({ message: 'You are already an accepted member of a team.' });
        }

        // 2. Generate unique teamId
        let teamId;
        let isUnique = false;
        while (!isUnique) {
            teamId = `TEAM-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            const existing = await prisma.guideTeam.findUnique({ where: { teamId } });
            if (!existing) isUnique = true;
        }

        // 3 & 4. Create GuideTeam and GuideTeamMember
        const newTeam = await prisma.guideTeam.create({
            data: {
                teamId,
                teamName,
                projectTitle,
                description,
                domain,
                abstractFile: req.file ? req.file.filename : null,
                leaderId: studentId,
                members: {
                    create: {
                        studentId,
                        isLeader: true,
                        inviteStatus: 'ACCEPTED',
                        respondedAt: new Date()
                    }
                }
            },
            include: {
                members: true
            }
        });

        res.status(201).json(newTeam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating team' });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const { teamName, projectTitle, description, domain } = req.body;
        const leaderId = req.user.id;
        
        const team = await prisma.guideTeam.findFirst({
            where: { leaderId }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        
        if (team.isFinalized) {
            return res.status(400).json({ message: 'Cannot edit a finalized team' });
        }

        const updatedTeam = await prisma.guideTeam.update({
            where: { id: team.id },
            data: {
                teamName: teamName || team.teamName,
                projectTitle: projectTitle || team.projectTitle,
                description: description || team.description,
                domain: domain || team.domain
            }
        });

        res.json({ message: 'Team updated successfully', team: updatedTeam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating team' });
    }
};

exports.inviteMember = async (req, res) => {
    try {
        const { teamId, registerNumberOrEmail } = req.body;
        const leaderId = req.user.id;

        // Verify phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        // 1. Verify requester is the leader
        const team = await prisma.guideTeam.findUnique({
            where: { teamId },
            include: { members: true }
        });

        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can invite members' });

        // 2. Count current members with inviteStatus PENDING or ACCEPTED
        const activeMembersCount = team.members.filter(m => m.inviteStatus === 'PENDING' || m.inviteStatus === 'ACCEPTED').length;
        if (activeMembersCount >= 2) {
            return res.status(400).json({ message: 'Team already has the maximum number of members (2)' });
        }

        // 3. Find target student
        const targetStudent = await prisma.user.findFirst({
            where: {
                role: 'STUDENT',
                OR: [
                    { email: registerNumberOrEmail },
                    { studentProfile: { studentId: registerNumberOrEmail } }
                ]
            },
            include: { studentProfile: true }
        });

        if (!targetStudent) return res.status(404).json({ message: 'Student not found' });
        if (targetStudent.id === leaderId) return res.status(400).json({ message: 'Cannot invite yourself' });

        // 4. Check target student has no PENDING or ACCEPTED invite
        const existingInvite = await prisma.guideTeamMember.findFirst({
            where: {
                studentId: targetStudent.id,
                inviteStatus: { in: ['PENDING', 'ACCEPTED'] }
            }
        });

        if (existingInvite) return res.status(400).json({ message: 'Student is already in a team or has a pending invite' });

        // 5. Create GuideTeamMember
        const invite = await prisma.guideTeamMember.create({
            data: {
                teamId: team.id,
                studentId: targetStudent.id,
                inviteStatus: 'PENDING'
            }
        });

        // 6. Create Notification
        const leader = await prisma.user.findUnique({ where: { id: leaderId } });
        await prisma.notification.create({
            data: {
                userId: targetStudent.id,
                title: "Team Invitation",
                message: `${leader.fullName} has invited you to join team "${team.teamName}" for project "${team.projectTitle}". Accept or Reject.`,
                type: "TEAM_INVITE",
                link: JSON.stringify({ teamId: team.teamId, leaderId })
            }
        });

        res.status(200).json({ message: 'Invitation sent successfully', invite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error sending invitation' });
    }
};

exports.respondToInvite = async (req, res) => {
    try {
        const { teamId, action } = req.body;
        const studentId = req.user.id;

        if (!['ACCEPT', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Verify phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (config && config.phase !== 'CLOSED') {
             return res.status(400).json({ message: 'Team formation is not active in the current phase.' });
        }

        const team = await prisma.guideTeam.findUnique({ where: { teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const invite = await prisma.guideTeamMember.findUnique({
            where: {
                teamId_studentId: {
                    teamId: team.id,
                    studentId
                }
            }
        });

        if (!invite || invite.inviteStatus !== 'PENDING') {
            return res.status(400).json({ message: 'No pending invitation found for this team' });
        }

        const student = await prisma.user.findUnique({ where: { id: studentId } });

        if (action === 'ACCEPT') {
            await prisma.guideTeamMember.update({
                where: { id: invite.id },
                data: { inviteStatus: 'ACCEPTED', respondedAt: new Date() }
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Team Invitation Accepted",
                    message: `${student.fullName} accepted and joined ${team.teamName}`,
                    type: "TEAM_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Invitation accepted' });
        } else if (action === 'REJECT') {
            await prisma.guideTeamMember.update({
                where: { id: invite.id },
                data: { inviteStatus: 'REJECTED', respondedAt: new Date() }
            });

            await prisma.notification.create({
                data: {
                    userId: team.leaderId,
                    title: "Team Invitation Declined",
                    message: `${student.fullName} declined your invitation. You can invite someone else.`,
                    type: "TEAM_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Invitation rejected' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error responding to invite' });
    }
};

exports.getMyPendingInvites = async (req, res) => {
    try {
        const studentId = req.user.id;

        const invites = await prisma.guideTeamMember.findMany({
            where: {
                studentId,
                inviteStatus: 'PENDING'
            },
            include: {
                team: {
                    include: {
                        leader: true
                    }
                }
            }
        });

        res.json(invites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching invites' });
    }
};

exports.getMyTeam = async (req, res) => {
    try {
        const studentId = req.user.id;

        const membership = await prisma.guideTeamMember.findFirst({
            where: {
                studentId,
                inviteStatus: 'ACCEPTED'
            },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                student: {
                                    include: { studentProfile: true }
                                }
                            }
                        },
                        guide: true
                    }
                }
            }
        });

        if (!membership) return res.json(null);

        res.json(membership.team);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching team' });
    }
};

exports.selectGuide = async (req, res) => {
    try {
        const { id: teamId } = req.params;
        const { facultyId } = req.body;
        const leaderId = req.user.id;

        // 1. Check phase
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'STUDENT_SELECTION') {
            return res.status(400).json({ message: 'Student selection phase is not active.' });
        }

        // 2. Verify team and leader
        const team = await prisma.guideTeam.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can select a guide' });

        if (team.guideStatus !== 'PENDING' && team.guideStatus !== 'FACULTY_SELECTED') {
             return res.status(400).json({ message: 'Team already has a guide assigned or selected.' });
        }

        // 3. Select guide via transaction
        await prisma.$transaction(async (tx) => {
            const slot = await tx.facultyGuideSlot.findUnique({ where: { facultyId: parseInt(facultyId) } });
            
            if (!slot || slot.usedSlots >= slot.totalSlots) {
                throw new Error("This guide has no available slots.");
            }

            await tx.facultyGuideSlot.update({
                where: { facultyId: parseInt(facultyId) },
                data: { usedSlots: { increment: 1 } }
            });

            await tx.guideTeam.update({
                where: { id: teamId },
                data: {
                    guideId: parseInt(facultyId),
                    guideStatus: 'STUDENT_SELECTED'
                }
            });
        });

        const faculty = await prisma.user.findUnique({ where: { id: parseInt(facultyId) } });

        await prisma.notification.create({
            data: {
                userId: leaderId,
                title: "Guide Selected",
                message: `You have successfully selected Prof. ${faculty.fullName} as your guide.`,
                type: "GUIDE_SELECTED"
            }
        });

        res.json({ message: 'Guide selected successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Server error selecting guide' });
    }
};

exports.getAvailableFaculty = async (req, res) => {
    try {
        const config = await prisma.guideSelectionConfig.findUnique({ where: { id: 'singleton' } });
        if (!config || config.phase !== 'STUDENT_SELECTION') {
            return res.status(403).json({ message: 'Guide Selection is not currently active.' });
        }

        const slots = await prisma.facultyGuideSlot.findMany({
            include: {
                faculty: {
                    include: { facultyProfile: true }
                }
            }
        });

        const available = slots.map(slot => ({
            facultyId: slot.facultyId,
            name: slot.faculty.fullName,
            profilePhoto: slot.faculty.profilePhoto,
            department: slot.faculty.facultyProfile?.department,
            researchAreas: slot.faculty.facultyProfile?.researchAreas || [],
            totalSlots: slot.totalSlots,
            usedSlots: slot.usedSlots,
            remainingSlots: slot.totalSlots - slot.usedSlots,
            available: slot.usedSlots < slot.totalSlots
        }));

        res.json(available);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching available faculty' });
    }
};

exports.respondToFacultyGuide = async (req, res) => {
    try {
        const { id: teamId } = req.params;
        const { facultyId, action } = req.body;
        const leaderId = req.user.id;

        if (!['ACCEPT', 'REJECT'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const team = await prisma.guideTeam.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leaderId !== leaderId) return res.status(403).json({ message: 'Only team leader can respond' });

        const selection = await prisma.facultyTeamSelection.findUnique({
            where: {
                facultyId_teamId: {
                    facultyId: parseInt(facultyId),
                    teamId
                }
            }
        });

        if (!selection || selection.status !== 'PENDING') {
            return res.status(400).json({ message: 'No pending faculty invitation found' });
        }

        const faculty = await prisma.user.findUnique({ where: { id: parseInt(facultyId) } });

        if (action === 'ACCEPT') {
            await prisma.$transaction(async (tx) => {
                 await tx.facultyTeamSelection.update({
                     where: { id: selection.id },
                     data: { status: 'ACCEPTED', respondedAt: new Date() }
                 });

                 await tx.guideTeam.update({
                     where: { id: teamId },
                     data: {
                         guideId: parseInt(facultyId),
                         guideStatus: 'ACCEPTED'
                     }
                 });

                 // Reject other pending faculty selections for this team
                 await tx.facultyTeamSelection.updateMany({
                     where: { teamId, status: 'PENDING', NOT: { id: selection.id } },
                     data: { status: 'REJECTED', respondedAt: new Date() }
                 });

                 await tx.facultyGuideSlot.update({
                     where: { facultyId: parseInt(facultyId) },
                     data: { usedSlots: { increment: 1 } }
                 });
            });

            await prisma.notification.create({
                data: {
                    userId: parseInt(facultyId),
                    title: "Guide Invitation Accepted",
                    message: `${team.teamName} accepted your guide invitation.`,
                    type: "GUIDE_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Faculty guide invitation accepted' });

        } else if (action === 'REJECT') {
            await prisma.facultyTeamSelection.update({
                where: { id: selection.id },
                data: { status: 'REJECTED', respondedAt: new Date() }
            });

            // If there are no other accepted or pending selections, revert guideStatus to PENDING
            const otherPending = await prisma.facultyTeamSelection.findFirst({
                 where: { teamId, status: 'PENDING' }
            });
            const anyAccepted = await prisma.facultyTeamSelection.findFirst({
                 where: { teamId, status: 'ACCEPTED' }
            });
            
            if (!otherPending && !anyAccepted) {
                 await prisma.guideTeam.update({
                     where: { id: teamId },
                     data: { guideStatus: 'PENDING' }
                 });
            }

            await prisma.notification.create({
                data: {
                    userId: parseInt(facultyId),
                    title: "Guide Invitation Declined",
                    message: `${team.teamName} declined your guide invitation.`,
                    type: "GUIDE_INVITE_RESPONSE"
                }
            });
            res.json({ message: 'Faculty guide invitation rejected' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error responding to faculty guide' });
    }
};

exports.getMyGuideInvites = async (req, res) => {
    try {
        const leaderId = req.user.id;
        
        const team = await prisma.guideTeam.findFirst({ where: { leaderId } });
        if (!team) return res.json([]);

        const selections = await prisma.facultyTeamSelection.findMany({
            where: {
                teamId: team.id,
                status: 'PENDING'
            },
            include: {
                faculty: {
                    include: { facultyProfile: true }
                }
            }
        });
        res.json(selections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching guide invites' });
    }
};
