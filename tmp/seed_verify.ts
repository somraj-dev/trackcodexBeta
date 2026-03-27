import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'test@trackcodex.com' },
    update: {},
    create: {
      email: 'test@trackcodex.com',
      name: 'Test User',
      username: 'testuser'
    }
  });

  console.log('User created:', user.id);

  // Create a project
  const projectId = '00000000-0000-4000-a000-000000000001'; // Valid UUID v4-ish for testing
  const project = await prisma.deployProject.upsert({
    where: { id: projectId },
    update: { slug: 'trackcodex' }, // Ensure slug is correct if it exists
    create: {
      id: projectId,
      name: 'TrackCodex',
      slug: 'trackcodex',
      repoOwner: 'somraj-dev',
      repoName: 'trackcodexBeta',
      framework: 'vite',
      ownerId: user.id,
      status: 'READY',
      analyticsEnabled: true
    }
  });

  console.log('Project created:', project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
