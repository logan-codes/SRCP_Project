const express = require('express');
const prisma = require('../config/prismaClient');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper to fetch or create the Unassigned Faculty placeholder.
 * This ensures Team creation never fails due to foreign key constraints.
 */
async function getUnassignedFacultyId() {
    let faculty = await prisma.faculty.findUnique({
        where: { emp_no: 'TEMP_UNASSIGNED' }
    });

    if (!faculty) {
        // Ensure the FACULTY role exists
        let role = await prisma.role.findUnique({ where: { name: 'FACULTY' } });
        if (!role) {
            role = await prisma.role.create({
                data: { id: 45312, name: 'FACULTY' }
            });
        }

        // Create a dummy user for the unassigned faculty
        const user = await prisma.user.create({
            data: {
                username: 'unassigned_faculty',
                password: 'placeholder_password',
                dob: '01-01-2000',
                role_id: role.id,
                is_first_login: false,
                is_active: false // Keep inactive to avoid showing in directories
            }
        });

        faculty = await prisma.faculty.create({
            data: {
                emp_no: 'TEMP_UNASSIGNED',
                user_id: user.id,
                name: 'Unassigned Faculty',
                mail_id: 'unassigned@sarc.ac.in',
                designation: 'Placeholder',
                department: 'None',
                total_capacity: 999,
                selection_capacity: 999,
                remaining_capacity: 999
            }
        });
    }

    return faculty.id;
}

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
 * Helper to save team metadata in AppConfig
 */
async function saveTeamMetadata(teamId, metadata) {
    const key = `team_metadata_${teamId}`;
    await prisma.appConfig.upsert({
        where: { key },
        update: { value: JSON.stringify(metadata) },
        create: { key, value: JSON.stringify(metadata) }
    });
}

/**
 * POST /api/guide/teams
 * Registers a student team.
 */
router.post('/teams', authenticate, async (req, res, next) => {
    try {
        const { projectTitle, description, domain } = req.body;
        if (!projectTitle || !domain) {
            return res.status(400).json({ success: false, message: 'Project title and domain are required.' });
        }

        // Verify the user is a student
        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        if (!student) {
            return res.status(400).json({ success: false, message: 'Only students can create project teams.' });
        }

        // Check if student is already in a team
        const existingMembership = await prisma.teamMember.findFirst({
            where: { student_id: student.id }
        });
        if (existingMembership) {
            return res.status(400).json({ success: false, message: 'You are already a member of a team.' });
        }

        // Find or create the Domain
        let domainRecord = await prisma.domain.findUnique({
            where: { name: domain }
        });
        if (!domainRecord) {
            domainRecord = await prisma.domain.create({
                data: { name: domain }
            });
        }

        // Get unassigned faculty ID
        const unassignedFacultyId = await getUnassignedFacultyId();

        // Create the Team
        const team = await prisma.team.create({
            data: {
                project_title: projectTitle,
                faculty_id: unassignedFacultyId,
                domain_id: domainRecord.id
            }
        });

        // Add creator as LEADER
        await prisma.teamMember.create({
            data: {
                team_id: team.id,
                student_id: student.id,
                role: 'LEADER'
            }
        });

        // Save description and status in AppConfig metadata
        await saveTeamMetadata(team.id, {
            description: description || '',
            guideStatus: 'PENDING',
            isFinalized: false,
            abstractFile: null
        });

        res.status(201).json({
            success: true,
            teamId: team.id,
            message: 'Team created successfully.'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/teams/my
 * Retrieves the current student's team details.
 */
router.get('/my', authenticate, async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        if (!student) {
            return res.status(400).json({ success: false, message: 'Only students have personal teams.' });
        }

        // Find the team membership
        const membership = await prisma.teamMember.findFirst({
            where: { student_id: student.id },
            include: {
                team: {
                    include: {
                        faculty: true,
                        domain: true
                    }
                }
            }
        });

        if (!membership) {
            return res.status(404).json({ success: false, message: 'You are not in a team.' });
        }

        const team = membership.team;
        const metadata = await getTeamMetadata(team.id);

        // Fetch team members (confirmed)
        const teamMembers = await prisma.teamMember.findMany({
            where: { team_id: team.id },
            include: { student: { include: { user: true } } }
        });

        const leader = teamMembers.find(m => m.role === 'LEADER');

        // Fetch active invites (pending)
        const pendingInvites = await prisma.invite.findMany({
            where: { team_id: team.id, is_active: true },
            include: { student: { include: { user: true } } }
        });

        // Format members list for frontend TeamCard compatibility
        const membersList = [];
        
        // Add active members
        teamMembers.forEach(m => {
            membersList.push({
                id: m.id,
                studentId: m.student_id,
                isLeader: m.role === 'LEADER',
                inviteStatus: 'ACCEPTED',
                student: {
                    fullName: m.student.name,
                    studentProfile: {
                        studentId: m.student.mail_id
                    }
                }
            });
        });

        // Add pending invites
        pendingInvites.forEach(inv => {
            membersList.push({
                id: `inv-${inv.id}`,
                studentId: inv.student_id,
                isLeader: false,
                inviteStatus: inv.response,
                student: {
                    fullName: inv.student.name,
                    studentProfile: {
                        studentId: inv.student.mail_id
                    }
                }
            });
        });

        // Format assigned guide details
        const isGuideAssigned = metadata.guideStatus === 'ACCEPTED' && team.faculty.emp_no !== 'TEMP_UNASSIGNED';
        const guideInfo = isGuideAssigned ? { fullName: team.faculty.name, email: team.faculty.mail_id } : null;

        res.json({
            teamId: team.id,
            projectTitle: team.project_title,
            description: metadata.description,
            domain: team.domain.name,
            guideStatus: metadata.guideStatus,
            isFinalized: metadata.isFinalized,
            abstractFile: metadata.abstractFile,
            leaderId: leader ? leader.student_id : null,
            members: membersList,
            guide: guideInfo
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/guide/teams/my
 * Updates the student's team details.
 */
router.put('/my', authenticate, async (req, res, next) => {
    try {
        const { projectTitle, description, domain } = req.body;

        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        const membership = await prisma.teamMember.findFirst({
            where: { student_id: student.id, role: 'LEADER' }
        });

        if (!membership) {
            return res.status(403).json({ success: false, message: 'Only the team leader can modify team details.' });
        }

        const teamId = membership.team_id;
        const metadata = await getTeamMetadata(teamId);

        if (metadata.isFinalized) {
            return res.status(400).json({ success: false, message: 'Cannot modify finalized team.' });
        }

        // Update domain
        let domainId = undefined;
        if (domain) {
            let domainRecord = await prisma.domain.findUnique({ where: { name: domain } });
            if (!domainRecord) {
                domainRecord = await prisma.domain.create({ data: { name: domain } });
            }
            domainId = domainRecord.id;
        }

        // Update database Team record
        await prisma.team.update({
            where: { id: teamId },
            data: {
                project_title: projectTitle || undefined,
                domain_id: domainId
            }
        });

        // Update AppConfig metadata
        metadata.description = description !== undefined ? description : metadata.description;
        await saveTeamMetadata(teamId, metadata);

        res.json({ success: true, message: 'Team details updated.' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/guide/teams/my
 * Deletes the student's team.
 */
router.delete('/my', authenticate, async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        const membership = await prisma.teamMember.findFirst({
            where: { student_id: student.id, role: 'LEADER' }
        });

        if (!membership) {
            return res.status(403).json({ success: false, message: 'Only the team leader can delete the team.' });
        }

        const teamId = membership.team_id;

        // Delete all dependent records in transaction
        await prisma.$transaction([
            prisma.invite.deleteMany({ where: { team_id: teamId } }),
            prisma.teamMember.deleteMany({ where: { team_id: teamId } }),
            prisma.appConfig.deleteMany({ where: { key: `team_metadata_${teamId}` } }),
            prisma.team.delete({ where: { id: teamId } })
        ]);

        res.json({ success: true, message: 'Team deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/guide/teams/invite
 * Invites a peer to join the team.
 */
router.post('/invite', authenticate, async (req, res, next) => {
    try {
        const { teamId, registerNumberOrEmail } = req.body;
        if (!registerNumberOrEmail) {
            return res.status(400).json({ success: false, message: 'Register number or email is required.' });
        }

        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        
        // Verify user is leader
        const leaderCheck = await prisma.teamMember.findFirst({
            where: { team_id: teamId, student_id: student.id, role: 'LEADER' }
        });
        if (!leaderCheck) {
            return res.status(403).json({ success: false, message: 'Only the team leader can invite members.' });
        }

        // Find peer student
        const peer = await prisma.student.findFirst({
            where: {
                OR: [
                    { mail_id: registerNumberOrEmail },
                    { phone_number: registerNumberOrEmail } // or matches details
                ]
            }
        });

        if (!peer) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // Check if peer is already in a team
        const peerInTeam = await prisma.teamMember.findFirst({
            where: { student_id: peer.id }
        });
        if (peerInTeam) {
            return res.status(400).json({ success: false, message: 'This student is already a member of a team.' });
        }

        // Check active invites count (max 2 members total)
        const currentMembersCount = await prisma.teamMember.count({ where: { team_id: teamId } });
        const currentInvitesCount = await prisma.invite.count({ where: { team_id: teamId, is_active: true } });
        
        if (currentMembersCount + currentInvitesCount >= 2) {
            return res.status(400).json({ success: false, message: 'Your team is full (max 2 members/invites allowed).' });
        }

        // Create Invite
        await prisma.invite.create({
            data: {
                student_id: peer.id,
                team_id: teamId,
                response: 'PENDING',
                is_active: true
            }
        });

        res.json({ success: true, message: 'Invitation sent successfully.' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/teams/invites/my
 * Retrieves invitations for the current student.
 */
router.get('/teams/invites/my', authenticate, async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });
        if (!student) {
            return res.status(400).json({ success: false, message: 'Only students have invitations.' });
        }

        const invites = await prisma.invite.findMany({
            where: { student_id: student.id, is_active: true, response: 'PENDING' },
            include: {
                team: {
                    include: {
                        members: {
                            where: { role: 'LEADER' },
                            include: { student: true }
                        }
                    }
                }
            }
        });

        const formatted = invites.map(inv => {
            const leader = inv.team.members[0];
            return {
                id: inv.id,
                teamId: inv.team_id,
                projectTitle: inv.team.project_title,
                leaderName: leader ? leader.student.name : 'Unknown'
            };
        });

        res.json(formatted);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/guide/teams/invite/respond
 * Accepts or rejects a team invitation.
 */
router.post('/teams/invite/respond', authenticate, async (req, res, next) => {
    try {
        const { inviteId, response } = req.body;
        if (!inviteId || !['ACCEPTED', 'REJECTED'].includes(response)) {
            return res.status(400).json({ success: false, message: 'Valid invite ID and response (ACCEPTED/REJECTED) are required.' });
        }

        const student = await prisma.student.findUnique({
            where: { user_id: req.user.id }
        });

        const invite = await prisma.invite.findFirst({
            where: { id: inviteId, student_id: student.id, is_active: true }
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: 'Invitation not found or expired.' });
        }

        if (response === 'ACCEPTED') {
            // Check if student is already in a team
            const inTeam = await prisma.teamMember.findFirst({ where: { student_id: student.id } });
            if (inTeam) {
                return res.status(400).json({ success: false, message: 'You are already in a team. Reject other invitations.' });
            }

            // Accept in transaction
            await prisma.$transaction([
                // Update current invite
                prisma.invite.update({
                    where: { id: inviteId },
                    data: { response: 'ACCEPTED', is_active: false }
                }),
                // Add to team members
                prisma.teamMember.create({
                    data: {
                        team_id: invite.team_id,
                        student_id: student.id,
                        role: 'MEMBER'
                    }
                }),
                // Deactivate other invites for this student
                prisma.invite.updateMany({
                    where: { student_id: student.id, id: { not: inviteId } },
                    data: { is_active: false, response: 'REJECTED' }
                })
            ]);

            // Automatically finalize team if it reached 2 members
            const totalMembers = await prisma.teamMember.count({ where: { team_id: invite.team_id } });
            if (totalMembers >= 2) {
                const metadata = await getTeamMetadata(invite.team_id);
                metadata.isFinalized = true;
                await saveTeamMetadata(invite.team_id, metadata);
            }

            res.json({ success: true, message: 'Joined the team successfully.' });
        } else {
            // Reject invite
            await prisma.invite.update({
                where: { id: inviteId },
                data: { response: 'REJECTED', is_active: false }
            });
            res.json({ success: true, message: 'Invitation rejected.' });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/faculty/available
 * Lists available faculty members.
 */
router.get('/faculty/available', authenticate, async (req, res, next) => {
    try {
        const facultyList = await prisma.faculty.findMany({
            where: { is_active: true }
        });

        // Filter out placeholder unassigned faculty
        const filtered = facultyList.filter(f => f.emp_no !== 'TEMP_UNASSIGNED').map(f => ({
            facultyId: f.id,
            name: f.name,
            department: f.department,
            designation: f.designation,
            profilePhoto: f.profile_photo,
            remainingCapacity: f.remaining_capacity,
            totalCapacity: f.total_capacity
        }));

        res.json(filtered);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/guide/teams/:teamId/select-guide
 * Student leader selects a guide.
 */
router.post('/teams/:teamId/select-guide', authenticate, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { facultyId } = req.body;

        const phase = await prisma.appConfig.findUnique({ where: { key: 'guide_selection_phase' } });
        if (!phase || phase.value === 'CLOSED') {
            return res.status(200).json({ success: false, message: 'Guide Selection is not currently active.' });
        }

        // Verify leader
        const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
        const member = await prisma.teamMember.findFirst({
            where: { team_id: parseInt(teamId, 10), student_id: student.id, role: 'LEADER' }
        });

        if (!member) {
            return res.status(403).json({ success: false, message: 'Only the team leader can select the guide.' });
        }

        const faculty = await prisma.faculty.findUnique({ where: { id: parseInt(facultyId, 10) } });
        if (!faculty || faculty.remaining_capacity <= 0) {
            return res.status(400).json({ success: false, message: 'Selected faculty is not available or has full capacity.' });
        }

        // Update Team guide
        await prisma.team.update({
            where: { id: parseInt(teamId, 10) },
            data: { faculty_id: faculty.id }
        });

        // Update status in metadata
        const metadata = await getTeamMetadata(teamId);
        metadata.guideStatus = 'STUDENT_SELECTED';
        await saveTeamMetadata(teamId, metadata);

        // Record request in faculty selections
        const selKey = `faculty_selections_${facultyId}`;
        const existingSelectionsConfig = await prisma.appConfig.findUnique({ where: { key: selKey } });
        let selectionsList = [];
        if (existingSelectionsConfig) {
            selectionsList = JSON.parse(existingSelectionsConfig.value);
        }
        if (!selectionsList.includes(parseInt(teamId, 10))) {
            selectionsList.push(parseInt(teamId, 10));
        }
        await prisma.appConfig.upsert({
            where: { key: selKey },
            update: { value: JSON.stringify(selectionsList) },
            create: { key: selKey, value: JSON.stringify(selectionsList) }
        });

        res.json({
            success: true,
            message: `Selected Prof. ${faculty.name} successfully. Waiting for confirmation.`
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/teams/invites/faculty
 * Retrieves invitations from faculty for the student's team.
 */
router.get('/teams/invites/faculty', authenticate, async (req, res, next) => {
    try {
        const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
        const member = await prisma.teamMember.findFirst({
            where: { student_id: student.id }
        });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }

        const key = `faculty_invites_${member.team_id}`;
        const config = await prisma.appConfig.findUnique({ where: { key } });
        if (!config) {
            return res.json([]);
        }

        const facultyIds = JSON.parse(config.value);
        const facultyList = await prisma.faculty.findMany({
            where: { id: { in: facultyIds } }
        });

        const formatted = facultyList.map(f => ({
            id: f.id,
            name: f.name,
            department: f.department,
            designation: f.designation
        }));

        res.json(formatted);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/guide/teams/:teamId/respond-faculty
 * Responds to a faculty's invitation.
 */
router.post('/teams/:teamId/respond-faculty', authenticate, async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { facultyId, response } = req.body;

        const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
        const member = await prisma.teamMember.findFirst({
            where: { team_id: parseInt(teamId, 10), student_id: student.id, role: 'LEADER' }
        });
        if (!member) {
            return res.status(403).json({ success: false, message: 'Only team leader can respond to invitations.' });
        }

        if (response === 'ACCEPTED') {
            const faculty = await prisma.faculty.findUnique({ where: { id: parseInt(facultyId, 10) } });
            if (!faculty || faculty.remaining_capacity <= 0) {
                return res.status(400).json({ success: false, message: 'Selected faculty has no remaining slots.' });
            }

            // Assign team to faculty
            await prisma.team.update({
                where: { id: parseInt(teamId, 10) },
                data: { faculty_id: faculty.id }
            });

            // Update Metadata
            const metadata = await getTeamMetadata(teamId);
            metadata.guideStatus = 'ACCEPTED';
            await saveTeamMetadata(teamId, metadata);

            // Deduct capacity
            await prisma.faculty.update({
                where: { id: faculty.id },
                data: { remaining_capacity: faculty.remaining_capacity - 1 }
            });

            // Clear invite list
            await prisma.appConfig.deleteMany({
                where: { key: `faculty_invites_${teamId}` }
            });

            res.json({ success: true, message: 'Guide allocation accepted.' });
        } else {
            // Remove faculty from invite list
            const key = `faculty_invites_${teamId}`;
            const config = await prisma.appConfig.findUnique({ where: { key } });
            if (config) {
                let list = JSON.parse(config.value);
                list = list.filter(id => id !== parseInt(facultyId, 10));
                await prisma.appConfig.update({
                    where: { key },
                    data: { value: JSON.stringify(list) }
                });
            }
            res.json({ success: true, message: 'Invitation rejected.' });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/faculty/teams
 * Faculty fetches available teams for selection.
 */
router.get('/faculty/teams', authenticate, async (req, res, next) => {
    try {
        const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
        if (!faculty) {
            return res.status(400).json({ success: false, message: 'Only faculty can fetch teams.' });
        }

        // Fetch all teams
        const teams = await prisma.team.findMany({
            include: {
                domain: true,
                members: {
                    include: { student: true }
                }
            }
        });

        // Filter teams that don't have a guide assigned
        const list = [];
        for (const team of teams) {
            const metadata = await getTeamMetadata(team.id);
            if (metadata.guideStatus !== 'ACCEPTED') {
                const formattedMembers = team.members.map(m => ({
                    id: m.id,
                    studentId: m.student_id,
                    isLeader: m.role === 'LEADER',
                    inviteStatus: 'ACCEPTED',
                    student: {
                        fullName: m.student.name,
                        studentProfile: {
                            studentId: m.student.mail_id
                        }
                    }
                }));

                list.push({
                    id: team.id,
                    teamId: `TEAM-${team.id}`,
                    teamName: `Team ${team.id}`,
                    projectTitle: team.project_title,
                    description: metadata.description,
                    domain: team.domain.name,
                    guideStatus: metadata.guideStatus,
                    members: formattedMembers
                });
            }
        }

        res.json(list);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/guide/faculty/select
 * Faculty invites/selects teams (max 2).
 */
router.post('/faculty/select', authenticate, async (req, res, next) => {
    try {
        const { teamIds } = req.body;
        if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Team IDs are required.' });
        }

        const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
        if (!faculty) {
            return res.status(400).json({ success: false, message: 'Only faculty members can select teams.' });
        }

        if (teamIds.length > 2) {
            return res.status(400).json({ success: false, message: 'You can only select up to 2 teams.' });
        }

        for (const teamId of teamIds) {
            // Add to faculty invites list for the team
            const key = `faculty_invites_${teamId}`;
            const config = await prisma.appConfig.findUnique({ where: { key } });
            let inviteList = [];
            if (config) {
                inviteList = JSON.parse(config.value);
            }
            if (!inviteList.includes(faculty.id)) {
                inviteList.push(faculty.id);
            }
            await prisma.appConfig.upsert({
                where: { key },
                update: { value: JSON.stringify(inviteList) },
                create: { key, value: JSON.stringify(inviteList) }
            });

            // Update metadata status
            const metadata = await getTeamMetadata(teamId);
            metadata.guideStatus = 'FACULTY_SELECTED';
            await saveTeamMetadata(teamId, metadata);
        }

        res.json({
            success: true,
            message: 'Invitations sent successfully. Waiting for student confirmation.'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/faculty/my-selections
 * Faculty fetches selected teams.
 */
router.get('/faculty/my-selections', authenticate, async (req, res, next) => {
    try {
        const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
        if (!faculty) {
            return res.status(400).json({ success: false, message: 'Only faculty can fetch selections.' });
        }

        // We find all teams where this faculty ID is in their faculty_invites list
        const teams = await prisma.team.findMany({
            include: {
                domain: true,
                members: { include: { student: true } }
            }
        });

        const selections = [];
        for (const team of teams) {
            const key = `faculty_invites_${team.id}`;
            const config = await prisma.appConfig.findUnique({ where: { key } });
            if (config) {
                const inviteIds = JSON.parse(config.value);
                if (inviteIds.includes(faculty.id)) {
                    const metadata = await getTeamMetadata(team.id);
                    selections.push({
                        id: team.id,
                        status: metadata.guideStatus,
                        team: {
                            teamId: `TEAM-${team.id}`,
                            teamName: `Team ${team.id}`,
                            projectTitle: team.project_title,
                            description: metadata.description,
                            domain: team.domain.name,
                            members: team.members.map(m => ({
                                id: m.id,
                                student: {
                                    fullName: m.student.name,
                                    studentProfile: { studentId: m.student.mail_id }
                                }
                            }))
                        }
                    });
                }
            }
        }

        res.json(selections);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/faculty/allocated
 * Faculty fetches allocated teams.
 */
router.get('/faculty/allocated', authenticate, async (req, res, next) => {
    try {
        const faculty = await prisma.faculty.findUnique({ where: { user_id: req.user.id } });
        if (!faculty) {
            return res.status(400).json({ success: false, message: 'Only faculty can fetch allocations.' });
        }

        // Find teams directly assigned to this faculty where guideStatus is ACCEPTED
        const teams = await prisma.team.findMany({
            where: { faculty_id: faculty.id },
            include: {
                domain: true,
                members: { include: { student: true } }
            }
        });

        const allocated = [];
        for (const team of teams) {
            const metadata = await getTeamMetadata(team.id);
            if (metadata.guideStatus === 'ACCEPTED') {
                allocated.push({
                    id: team.id,
                    teamId: `TEAM-${team.id}`,
                    teamName: `Team ${team.id}`,
                    projectTitle: team.project_title,
                    description: metadata.description,
                    domain: team.domain.name,
                    members: team.members.map(m => ({
                        id: m.id,
                        student: {
                            fullName: m.student.name,
                            studentProfile: { studentId: m.student.mail_id }
                        }
                    }))
                });
            }
        }

        res.json(allocated);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/phase
 * Returns the current phase of the selection process.
 */
router.get('/phase', authenticate, async (req, res, next) => {
    try {
        const phase = await prisma.appConfig.findUnique({ where: { key: 'guide_selection_phase' } });
        res.json({ phase: phase ? phase.value : 'CLOSED' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/guide/dashboard
 * Summary of stats for guide selection.
 */
router.get('/dashboard', authenticate, async (req, res, next) => {
    try {
        const totalTeamsCount = await prisma.team.count();
        const activeInvitesCount = await prisma.invite.count({ where: { is_active: true } });
        const totalStudentsCount = await prisma.student.count();

        res.json({
            totalTeams: totalTeamsCount,
            activeInvites: activeInvitesCount,
            totalStudents: totalStudentsCount
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
