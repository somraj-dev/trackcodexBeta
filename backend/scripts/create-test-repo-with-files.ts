import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const prisma = new PrismaClient();

async function exec(cmd: string, args: string[], cwd: string) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    p.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`Command ${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");

    const repoName = `test-repo-verify-${Date.now()}`;
    const repo = await prisma.repository.create({
      data: {
        name: repoName,
        description: "Test repository with README and .gitignore for verification",
        isPublic: true,
        visibility: "PUBLIC",
        owner: { connect: { id: user.id } },
        stars: 0,
        forksCount: 0,
        cloneUrl: `https://trackcodex.com/git/${user.username}/${repoName}.git`,
        htmlUrl: `https://trackcodex.com/repo/${repoName}`,
        techStack: "TypeScript",
        techColor: "#3178c6"
      }
    });

    console.log(`REPO_ID:${repo.id}`);
    console.log(`REPO_NAME:${repoName}`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
