import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const events = await prisma.outboxEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(events, null, 2));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
