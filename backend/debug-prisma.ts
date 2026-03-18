
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), '../.env') });

console.log('--- ENV CHECK ---');
console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'UNDEFINED');

const prisma = new PrismaClient();

async function main() {
  console.log('--- PRISMA CHECK ---');
  try {
    // This is a hacky way to see the internal state if possible, or just try a query
    const userCount = await prisma.user.count();
    console.log('Successfully connected! User count:', userCount);
  } catch (err: any) {
    console.error('Connection failed!');
    console.error('Error message:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
