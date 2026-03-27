import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@trackcodex.com';
  const projectId = '00000000-0000-4000-a000-000000000001';

  // Clean up
  await prisma.deployProject.deleteMany({ where: { id: projectId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email } }).catch(() => {});

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      username: 'testuser'
    }
  });

  console.log('User created:', user.id);

  // Create project
  const project = await prisma.deployProject.create({
    data: {
      id: projectId,
      name: 'TrackCodex',
      slug: 'trackcodex',
      ownerId: user.id
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
