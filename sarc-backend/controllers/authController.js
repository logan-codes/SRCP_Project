const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = new PrismaClient();

// Ensure JWT Secrets are available (fail fast)
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET or JWT_REFRESH_SECRET is not defined in environment variables.');
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Password Strength Validator
const isPasswordStrong = (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// Helper: Send Email
const sendEmail = async (to, subject, text) => {
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const mailOptions = {
        from: '"SARCG Admin" <admin@sarcg.com>',
        to,
        subject,
        text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    if (!process.env.SMTP_USER) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
};

// Helper: Generate Tokens
const generateTokens = async (userId, role) => {
    const payload = { user: { id: userId, role } };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    // Hash refresh token for DB storage
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: hashedRefreshToken }
    });

    return { accessToken, refreshToken };
};


// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!isPasswordStrong(password)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Prevent Privilege Escalation - only allow STUDENT or FACULTY
        const requestedRole = role ? role.toUpperCase() : 'STUDENT';
        const prismaRole = requestedRole === 'ADMIN' ? 'STUDENT' : requestedRole;

        // Email Verification Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role: prismaRole,
                emailVerificationToken: hashedVerificationToken,
                isEmailVerified: false,
            },
        });

        await prisma.studentProfile.create({ data: { userId: user.id } });

        // Send Verification Email
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${email}`;
        await sendEmail(user.email, 'Verify your email address', `Welcome to SARCG! Please verify your email by clicking: ${verifyUrl}`);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/verify-email
// @desc    Verify user email
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { email, token } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token or email.' });
        }

        if (user.isEmailVerified) {
            return res.status(200).json({ message: 'Email is already verified. You can now log in.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (user.emailVerificationToken !== hashedToken) {
            return res.status(400).json({ message: 'Invalid verification token.' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null
            }
        });

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        
        // Anti-enumeration: Generic message
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return res.status(403).json({ message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            const attempts = user.failedLoginAttempts + 1;
            const updates = { failedLoginAttempts: attempts };
            
            if (attempts >= 5) {
                updates.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
            }
            
            await prisma.user.update({ where: { id: user.id }, data: updates });
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: 'Please verify your email address before logging in.' });
        }

        // Reset login attempts
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null }
        });

        const { accessToken, refreshToken } = await generateTokens(user.id, user.role);

        res.json({ token: accessToken, refreshToken, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.user.id } });

        if (!user || !user.refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
        if (hashedProvidedToken !== user.refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.json({ token: newAccessToken });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: 'Refresh token expired or invalid' });
    }
};

// @route   GET api/auth/me
// @desc    Get user by token
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                studentProfile: true,
                facultyProfile: true,
                industryProfile: true,
                adminProfile: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, refreshToken, emailVerificationToken, resetPasswordToken, failedLoginAttempts, lockoutUntil, ...userBase } = user;

        res.json({ ...userBase, id: userBase.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   PUT api/auth/profile
// @desc    Update user profile data
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const {
            fullName, department, bio, companyName, designation, skills,
            studentId, yearOfStudy, section, programmingLanguages, projectsCompleted, githubLink, areasOfInterest,
            facultyId, researchAreas, yearsOfExperience, contactNumber, linkedin, pastProjects
        } = req.body;

        const profilePhoto = req.files && req.files['profilePhoto'] ? req.files['profilePhoto'][0].filename : undefined;
        const resumeFile = req.files && req.files['resumeFile'] ? req.files['resumeFile'][0].filename : undefined;

        const parseArray = (val) => {
            if (!val) return undefined;
            if (Array.isArray(val)) return val;
            try {
                return JSON.parse(val);
            } catch (e) {
                return typeof val === 'string' ? val.split(',').map(s => s.trim()) : undefined;
            }
        };

        const parsedSkills = parseArray(skills);
        const parsedProgrammingLanguages = parseArray(programmingLanguages);
        const parsedAreasOfInterest = parseArray(areasOfInterest);
        const parsedResearchAreas = parseArray(researchAreas);
        const parsedPastProjects = parseArray(pastProjects);

        const userUpdateData = {};
        if (fullName !== undefined) userUpdateData.fullName = fullName;
        if (profilePhoto !== undefined) userUpdateData.profilePhoto = profilePhoto;

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: userUpdateData
            });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'STUDENT') {
            await prisma.studentProfile.update({
                where: { userId: req.user.id },
                data: {
                    department, bio, skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    studentId, yearOfStudy, section,
                    programmingLanguages: parsedProgrammingLanguages !== undefined ? parsedProgrammingLanguages : undefined,
                    projectsCompleted: projectsCompleted ? parseInt(projectsCompleted) : undefined,
                    githubLink, resumeFile,
                    areasOfInterest: parsedAreasOfInterest !== undefined ? parsedAreasOfInterest : undefined
                }
            });
        } else if (user.role === 'FACULTY') {
            await prisma.facultyProfile.update({
                where: { userId: req.user.id },
                data: {
                    department, bio, designation, facultyId,
                    researchAreas: parsedResearchAreas !== undefined ? parsedResearchAreas : undefined,
                    yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
                    skills: parsedSkills !== undefined ? parsedSkills : undefined,
                    contactNumber, linkedin,
                    pastProjects: parsedPastProjects !== undefined ? parsedPastProjects.map(p => typeof p === 'string' ? p : JSON.stringify(p)) : undefined
                }
            });
        } else if (user.role === 'INDUSTRY') {
            await prisma.industryProfile.update({
                where: { userId: req.user.id },
                data: { companyName, bio, designation }
            });
        } else if (user.role === 'ADMIN') {
            await prisma.adminProfile.update({
                where: { userId: req.user.id },
                data: { department }
            });
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true, facultyProfile: true, industryProfile: true, adminProfile: true }
        });

        const { password, refreshToken, emailVerificationToken, resetPasswordToken, failedLoginAttempts, lockoutUntil, ...userBase } = updatedUser;
        res.json({ ...userBase, id: userBase.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        // User Enumeration Prevention: Always return this success message
        const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

        if (!user) {
            return res.status(200).json({ message: genericMessage });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
            }
        });

        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}`;
        
        await sendEmail(user.email, 'Password Reset Request', `You requested a password reset. Click here to reset: ${resetUrl}`);

        res.status(200).json({ message: genericMessage });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!isPasswordStrong(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' });
        }

        const user = await prisma.user.findFirst({
            where: {
                email,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user || !user.resetPasswordToken) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (hashedProvidedToken !== user.resetPasswordToken) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                lockoutUntil: null,
                failedLoginAttempts: 0
            }
        });

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
