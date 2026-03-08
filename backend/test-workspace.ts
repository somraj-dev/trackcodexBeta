import { WorkspaceManager } from './services/workspaceManager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const repo = await prisma.repository.findFirst();
        if (!repo) {
            console.log("No repo found to test.");
            return;
        }

        console.log(`Starting workspace for repo ${repo.name} (${repo.id})...`);
        const result = await WorkspaceManager.startWorkspace(repo.id, {
            repoName: repo.name,
            cloneUrl: repo.cloneUrl || `https://github.com/torvalds/linux.git`
        });

        console.log("Workspace Provisioning Result:", result);
    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();



