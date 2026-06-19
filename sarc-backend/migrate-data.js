const { PrismaClient } = require('@prisma/client');

const sourcePrisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres.hkfbrurmycvjlptpevsa:S%40urabh%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
});

const targetPrisma = new PrismaClient({
    datasourceUrl: "postgresql://postgres.docylrbacdtzjrygrjvk:Sarcgpoartl%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
});

async function migrateData() {
    try {
        console.log("Connecting to databases...");
        
        // Define tables in strict dependency order to avoid foreign key violations
        const tables = [
            'user',
            'studentProfile',
            'facultyProfile',
            'industryProfile',
            'adminProfile',
            'project',
            'projectIdea',
            'application',
            'notification',
            'team',
            'teamMember',
            'milestone',
            'guideTeam',
            'guideTeamMember',
            'facultyGuideSlot',
            'facultyTeamSelection',
            'guideSelectionConfig',
            'globalMilestone',
            'systemConfig'
        ];

        for (const table of tables) {
            console.log(`Reading from old database: ${table}...`);
            const rows = await sourcePrisma[table].findMany();
            if (rows.length > 0) {
                console.log(`Inserting ${rows.length} rows into new database: ${table}...`);
                await targetPrisma[table].createMany({
                    data: rows,
                    skipDuplicates: true
                });
                
                // Update the Postgres sequence if this table uses an auto-incrementing integer ID
                if (rows.length > 0 && typeof rows[0].id === 'number') {
                    // Capitalize the first letter for the actual table name (Prisma convention)
                    let tableName = table.charAt(0).toUpperCase() + table.slice(1);
                    // Handle camelCase names correctly (e.g. StudentProfile)
                    try {
                        await targetPrisma.$executeRawUnsafe(`
                            SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${tableName}";
                        `);
                        console.log(`Updated sequence for ${tableName}.`);
                    } catch (seqErr) {
                        console.log(`Skipped sequence update for ${tableName} (might not be an auto-incrementing PK).`);
                    }
                }
            } else {
                console.log(`No records found in ${table}.`);
            }
        }

        console.log("Data migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await sourcePrisma.$disconnect();
        await targetPrisma.$disconnect();
    }
}

migrateData();
