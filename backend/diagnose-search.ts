import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      accountLocked: false,
      isPrivate: false,
      username: { not: null },
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });
  
  console.log(`Found ${users.length} users with valid search criteria.`);
  console.log(users.slice(0, 5));
  
  const allUsers = await prisma.user.findMany({ select: { id: true, username: true, isPrivate: true, deletedAt: true, accountLocked: true } });
  console.log(`\nTotal users in DB: ${allUsers.length}`);
  
  const missingUsername = allUsers.filter(u => !u.username).length;
  const privateUsers = allUsers.filter(u => u.isPrivate).length;
  const lockedUsers = allUsers.filter(u => u.accountLocked).length;
  
  console.log(`Users missing username: ${missingUsername}`);
  console.log(`Private users: ${privateUsers}`);
  console.log(`Locked users: ${lockedUsers}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
