import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = '00000000-0000-4000-a000-000000000001';
  
  // 1. Ensure project exists
  const project = await prisma.deployProject.findUnique({ where: { id: projectId } });
  if (!project) {
    console.error('Project not found. Please run seed script first.');
    return;
  }

  console.log('Testing ingestion logic for project:', project.name);

  // 2. Direct Ingestion Logic (Copy-pasted from analytics.ts)
  const status = 200;
  const latency = 120;
  const bandwidth = 5000;
  
  const now = new Date();
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const isError = status >= 400 ? 1 : 0;

  console.log('Simulating ingestion for hour:', startOfHour.toISOString());

  await (prisma as any).projectMetric.upsert({
    where: {
      projectId_timestamp: {
        projectId,
        timestamp: startOfHour
      }
    },
    update: {
      requests: { increment: 1 },
      errors: { increment: isError },
      bandwidth: { increment: BigInt(bandwidth || 0) },
      avgLatency: { increment: latency || 0 } 
    },
    create: {
      projectId,
      timestamp: startOfHour,
      requests: 1,
      errors: isError,
      bandwidth: BigInt(bandwidth || 0),
      avgLatency: latency || 0,
      statusCodes: JSON.stringify({ [status]: 1 })
    }
  });

  console.log('✅ Ingestion record created/updated successfully in DB.');

  // 3. Verify Retrieval
  const metrics = await prisma.projectMetric.findMany({
    where: { projectId },
    orderBy: { timestamp: 'desc' },
    take: 1
  });

  console.log('Verification Retrieval:', JSON.stringify(metrics, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch((e) => {
    console.error('VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
