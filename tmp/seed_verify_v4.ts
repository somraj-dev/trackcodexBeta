import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'test-final@trackcodex.com';

  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        username: 'testuser_final'
      }
    });

    console.log('User created:', user.id);

    // Create project
    const project = await prisma.deployProject.create({
      data: {
        name: 'TrackCodex Test',
        slug: 'trackcodex-test',
        ownerId: user.id
      }
    });

    console.log('Project created:', project.id);
  } catch (err: any) {
    console.error('MESSAGE:', err.message);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
