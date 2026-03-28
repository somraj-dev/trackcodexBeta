import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../services/infra/prisma";
import bcrypt from "bcryptjs";

/**
 * Git Smart HTTP Authentication Middleware
 * 
 * Supports two authentication methods for `git clone/push/pull`:
 *   1. Personal Access Token (PAT): username + PAT as password (recommended)
 *      Example: git clone https://username:tc_xxxxxx@api.trackcodex.com/git/owner/repo.git
 *   2. Password Auth: username + password (legacy, for users with password set)
 */
export async function verifyGitAuth(req: FastifyRequest, reply: FastifyReply) {
  // 1. Identify Repository and Operation
  const { owner, repo: repoName, repoId } = req.params as any;
  const service = (req.params as any).service || (req.query as any).service;
  const isWrite = service === "git-receive-pack" || req.url.includes("git-receive-pack");

  let repo;
  if (owner && repoName) {
    const ownerUser = await prisma.user.findUnique({ where: { username: owner } });
    if (!ownerUser) return reply.status(404).send("Owner not found");

    repo = await prisma.repository.findFirst({
      where: { name: repoName, ownerId: ownerUser.id },
    });
  } else {
    repo = await prisma.repository.findFirst({
      where: { OR: [{ id: repoId || "" }, { name: repoId || "" }] },
    });
  }

  if (!repo) return reply.status(404).send("Repository not found");

  // 2. Allow anonymous access for Public Reads (git clone/pull)
  if (repo.visibility === "PUBLIC" && !isWrite && !req.headers.authorization) {
    return; // Pass through: anonymous read access granted
  }

  // 3. Require Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    reply.header("WWW-Authenticate", 'Basic realm="TrackCodex Git"');
    return reply.status(401).send("Authentication required. Use a Personal Access Token as password.");
  }

  // 4. Decode Credentials
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic") return reply.status(400).send("Invalid auth scheme");

  const decoded = Buffer.from(encoded, "base64").toString();
  const colonIdx = decoded.indexOf(":");
  if (colonIdx === -1) return reply.status(400).send("Invalid credentials format");

  const username = decoded.substring(0, colonIdx);
  const password = decoded.substring(colonIdx + 1);

  // 5. Verify User
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return reply.status(401).send("Invalid credentials");

  // 6. Authenticate via PAT or Password
  let authenticated = false;

  if (password.startsWith("tc_")) {
    const prefix = password.substring(0, 8);
    const tokens = await prisma.personalAccessToken.findMany({
      where: {
        userId: user.id,
        prefix,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    for (const token of tokens) {
      const valid = await bcrypt.compare(password, token.tokenHash);
      if (valid) {
        authenticated = true;
        if (!token.scopes.includes("repo") && !token.scopes.includes("admin")) {
          return reply.status(403).send("Token does not have 'repo' scope");
        }
        prisma.personalAccessToken.update({
          where: { id: token.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => { /* ignore */ });
        break;
      }
    }
  }

  if (!authenticated && user.password) {
    const valid = await bcrypt.compare(password, user.password);
    if (valid) authenticated = true;
  }

  if (!authenticated) {
    return reply.status(401).send(
      "Authentication failed. Use a Personal Access Token (PAT) as your password.\n" +
      "Generate one at: Settings → Developer → Personal Access Tokens"
    );
  }

  // 7. Verify Authorization (User context vs Repo)
  if (repo.visibility !== "PUBLIC" || isWrite) {
    if (repo.ownerId !== user.id) {
      // TODO: Check RepoPermission table for collaborator access
      return reply.status(403).send("Permission denied");
    }
  }

  // Attach user to request
  (req as any).user = user;
}
