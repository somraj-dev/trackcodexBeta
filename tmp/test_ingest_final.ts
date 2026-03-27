import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'test-final@trackcodex.com';
  const projectId = '00000000-0000-4000-a000-000000000001';

  try {
    // Upsert User
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: 'Test User',
        username: 'testuser_final'
      }
    });

    console.log('User ready:', user.id);

    // Upsert Project
    const project = await prisma.deployProject.upsert({
      where: { id: projectId },
      update: { slug: 'trackcodex', name: 'TrackCodex' },
      create: {
        id: projectId,
        name: 'TrackCodex',
        slug: 'trackcodex',
        ownerId: user.id,
        analyticsEnabled: true
      }
    });

    console.log('Project ready:', project.id, '(slug:', project.slug, ')');

    // Test Ingestion via Backend (assuming it's running on 4000)
    console.log('Sending mock ingestion event...');
    const ingestRes = await fetch('http://localhost:4000/api/v1/infra/analytics/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        status: 200,
        latency: 120,
        bandwidth: 1024,
        method: 'GET',
        secret: 'super-secret-worker-token-123'
      })
    });

    const ingestData = await ingestRes.json();
    console.log('Ingestion Response:', ingestData);

    if (ingestData.success) {
      console.log('SUCCESS: Analytics connection is functional!');
    } else {
      console.error('FAILED: Analytics ingestion failed.');
    }

  } catch (err: any) {
    console.error('ERROR during test:', err.message);
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
