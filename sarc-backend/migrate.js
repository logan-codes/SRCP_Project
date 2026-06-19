const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const oldDb = new PrismaClient({ datasources: { db: { url: process.env.OLD_DIRECT_URL } } });
const newDb = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });

async function migrate() {
    console.log("Starting migration...");
    
    // Ordered to respect foreign key constraints
    const tables = [
        "User",
        "StudentProfile",
        "FacultyProfile",
        "IndustryProfile",
        "AdminProfile",
        "Project",
        "ProjectIdea",
        "Application",
        "Notification",
        "Team",
        "TeamMember",
        "Milestone",
        "GuideSelectionConfig",
        "SystemConfig",
        "GlobalMilestone",
        "GuideTeam",
        "GuideTeamMember",
        "FacultyGuideSlot",
        "FacultyTeamSelection",
        "Session"
    ];

    for (const table of tables) {
        console.log(`Migrating ${table}...`);
        
        try {
            const rows = await oldDb.$queryRawUnsafe(`SELECT * FROM "${table}";`);
            
            if (rows.length === 0) {
                console.log(`No data in ${table}, skipping.`);
                continue;
            }

            const modelName = table.charAt(0).toLowerCase() + table.slice(1);
            
            rows.forEach(row => {
                ['skills', 'programmingLanguages', 'areasOfInterest', 'researchAreas', 'technologies', 'skillsRequired', 'imageFiles', 'pastProjects'].forEach(field => {
                    if (row.hasOwnProperty(field) && row[field] === null) {
                        row[field] = [];
                    }
                });
            });
            
            await newDb[modelName].createMany({
                data: rows,
                skipDuplicates: true
            });
            console.log(`Inserted ${rows.length} rows into ${table}.`);
            
            if (rows.length > 0 && typeof rows[0].id === 'number') {
                const seqQuery = `SELECT setval('"${table}_id_seq"', coalesce(max(id), 0) + 1, false) FROM "${table}";`;
                await newDb.$executeRawUnsafe(seqQuery);
                console.log(`Updated sequence for ${table}`);
            }
        } catch(e) {
            console.error(`Error migrating ${table}:`, e.message);
        }
    }
    
    console.log("Migration finished!");
}

migrate().then(async () => {
    await oldDb.$disconnect();
    await newDb.$disconnect();
    process.exit(0);
}).catch(async (e) => {
    console.error(e);
    await oldDb.$disconnect();
    await newDb.$disconnect();
    process.exit(1);
});
