import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/prisma";
import bcrypt from "bcryptjs";

// Shared prisma instance

export async function verifyGitAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  // 1. Request Basic Auth if missing
  if (!authHeader) {
    reply.header("WWW-Authenticate", 'Basic realm="TrackCodex Git"');
    return reply.status(401).send("Authentication required");
  }

  // 2. Decode credentials
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic") return reply.status(400).send("Invalid auth scheme");

  const [username, password] = Buffer.from(encoded, "base64")
    .toString()
    .split(":");

  // 3. Verify User
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return reply.status(401).send("Invalid credentials");
  }

  // 4. Verify Password (or PAT in future)
  const valid = await bcrypt.compare(password, user.password || "");
  if (!valid) {
    // TODO: Check Personal Access Tokens table
    return reply.status(401).send("Invalid credentials");
  }

  // 5. Check Repo Permissions
  const { owner, repo: repoName, repoId } = req.params as any;

  let repo;
  if (owner && repoName) {
    // Lookup by owner username and repo name
    const ownerUser = await prisma.user.findUnique({ where: { username: owner } });
    if (!ownerUser) return reply.status(404).send("Owner not found");

    repo = await prisma.repository.findFirst({
      where: {
        name: repoName,
        ownerId: ownerUser.id
      }
    });
  } else {
    // Legacy/ID-based lookup
    repo = await prisma.repository.findFirst({
      where: { OR: [{ id: repoId }, { name: repoId }] },
    });
  }

  if (!repo) {
    return reply.status(404).send("Repository not found");
  }

  // Check specific permission based on Action
  // git-upload-pack (Fetch) -> Read
  // git-receive-pack (Push) -> Write
  const service = (req.params as any).service || (req.query as any).service;
  const isWrite =
    service === "git-receive-pack" || req.url.includes("git-receive-pack");

  // Super simple check for MVP: Owner only or Public Read
  if (repo.visibility === "PUBLIC" && !isWrite) {
    // Allow public read
    req.user = user;
    return;
  }

  // Otherwise, check ownership (or collaborator/team tables)
  // TODO: Full RBAC check
  if (repo.ownerId !== user.id) {
    // Check collaborators...
    return reply.status(403).send("Permission denied");
  }

  // Attach user to request
  req.user = user;
}
