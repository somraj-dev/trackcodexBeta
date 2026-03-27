import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'test-raw@trackcodex.com';
  const projectId = '00000000-0000-4000-a000-000000000001';

  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        username: 'testuser_raw'
      }
    });

    console.log('User created:', user.id);

    // Raw SQL insert
    await prisma.$executeRaw`
      INSERT INTO "DeployProject" (id, name, slug, "ownerId", "updatedAt")
      VALUES (${projectId}, 'TrackCodex Raw', 'trackcodex-raw', ${user.id}, NOW())
    `;

    console.log('Project created via RAW SQL:', projectId);

    // Now test ingestion
    const res = await fetch('http://localhost:4000/api/v1/infra/analytics/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        status: 200,
        latency: 150,
        bandwidth: 5000,
        method: 'GET',
        secret: 'super-secret-worker-token-123'
      })
    });

    const result = await res.json();
    console.log('Ingestion result:', result);

  } catch (err: any) {
    console.error('ERROR:', err);
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
