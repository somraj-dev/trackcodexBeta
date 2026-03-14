import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: 'quantaforge', mode: 'insensitive' } },
        { name: { contains: 'quantaforge', mode: 'insensitive' } },
        { email: { contains: 'quantaforge', mode: 'insensitive' } }
      ]
    },
    include: { profile: true }
  });
  console.log('Search Results for "quantaforge":', JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
