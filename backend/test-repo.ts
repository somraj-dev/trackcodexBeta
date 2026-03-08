import { PrismaClient } from '@prisma/client';
import { SCMService } from './services/scmService';

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
    try {
        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("No user found");
        const name = `test-repo-${Date.now()}`;

        console.log(`User: ${user.id}`);

        // 2. Create DB record
        const repoData = await prisma.repository.create({
            data: {
                name,
                description: "Test",
                isPublic: false,
                language: "TypeScript",
                owner: { connect: { id: user.id } },
                stars: 0,
                forksCount: 0,
                cloneUrl: `https://test.com/git/me/${name}.git`,
                htmlUrl: `https://test.com/repo/me/${name}`,
            },
        });

        console.log(`DB Record created: ${repoData.id}`);

        // 3. Init physical Git repo
        await SCMService.createRepository({
            id: repoData.id,
            name: repoData.name,
            description: repoData.description || undefined,
            techStack: repoData.language || undefined,
        });

        console.log(`Native Git initialized successfully`);
    } catch (err) {
        console.error("Error creating repo:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();



