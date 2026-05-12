const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');

const prisma = new PrismaClient();

const cleanupOldAgents = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find agents deleted more than 30 days ago and permanently remove them
        const result = await prisma.agent.deleteMany({
            where: {
                deletedAt: {
                    lte: thirtyDaysAgo
                }
            }
        });

        if (result.count > 0) {
            console.log(`\n🧹 [Cleanup] Trwale usunięto z bazy ${result.count} zarchiwizowanych agentów (starsze niż 30 dni)`);
        }
    } catch (error) {
        console.error('Błąd podczas czyszczenia zarchiwizowanych agentów:', error);
    }
};

const startCleanupCron = () => {
    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ [Cron] Uruchamianie czyszczenia starych agentów...');
        await cleanupOldAgents();
    });

    // As a bonus, we can run it once immediately on server start
    cleanupOldAgents();
};

module.exports = { startCleanupCron };
