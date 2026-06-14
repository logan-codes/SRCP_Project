const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all global milestones
const getGlobalMilestones = async (req, res) => {
    try {
        const milestones = await prisma.globalMilestone.findMany({
            orderBy: {
                dueDate: 'asc'
            }
        });
        res.json(milestones);
    } catch (err) {
        console.error("Error fetching global milestones:", err);
        res.status(500).json({ error: "Failed to fetch global milestones." });
    }
};

// Create a new global milestone (Admin only)
const createGlobalMilestone = async (req, res) => {
    const { title, description, dueDate, status } = req.body;
    try {
        const newMilestone = await prisma.globalMilestone.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                status: status || 'PENDING'
            }
        });
        res.status(201).json(newMilestone);
    } catch (err) {
        console.error("Error creating global milestone:", err);
        res.status(500).json({ error: "Failed to create global milestone." });
    }
};

// Update a global milestone (Admin only)
const updateGlobalMilestone = async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, status } = req.body;
    try {
        const updatedMilestone = await prisma.globalMilestone.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                status
            }
        });
        res.json(updatedMilestone);
    } catch (err) {
        console.error("Error updating global milestone:", err);
        res.status(500).json({ error: "Failed to update global milestone." });
    }
};

// Delete a global milestone (Admin only)
const deleteGlobalMilestone = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.globalMilestone.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Global milestone deleted successfully." });
    } catch (err) {
        console.error("Error deleting global milestone:", err);
        res.status(500).json({ error: "Failed to delete global milestone." });
    }
};

module.exports = {
    getGlobalMilestones,
    createGlobalMilestone,
    updateGlobalMilestone,
    deleteGlobalMilestone
};
