import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Personal Access Token (PAT) Routes
 * 
 * Allows users to create, list, and revoke tokens for Git CLI operations.
 * Token format: tc_<40 random hex chars> (total 43 chars)
 * 
 * Usage with Git:
 *   git clone https://<username>:<token>@api.trackcodex.com/git/<owner>/<repo>.git
 */
export async function tokenRoutes(fastify: FastifyInstance) {

  // ── Create a new Personal Access Token ──
  // POST /api/v1/auth/tokens
  fastify.post(
    "/auth/tokens",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const { name, scopes, expiresInDays } = request.body as {
        name: string;
        scopes?: string[];
        expiresInDays?: number;
      };

      if (!name || name.trim().length === 0) {
        return reply.code(400).send({ error: "Token name is required" });
      }

      // Check limit (max 10 tokens per user)
      const existingCount = await prisma.personalAccessToken.count({
        where: { userId: user.userId },
      });
      if (existingCount >= 10) {
        return reply.code(400).send({
          error: "Maximum 10 tokens allowed. Revoke an existing token first.",
        });
      }

      // Generate token: tc_ + 40 random hex characters
      const rawToken = `tc_${crypto.randomBytes(20).toString("hex")}`;
      const prefix = rawToken.substring(0, 8); // "tc_xxxxx" for lookup
      const tokenHash = await bcrypt.hash(rawToken, 10);

      // Calculate expiry
      let expiresAt: Date | null = null;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const validScopes = scopes && scopes.length > 0 ? scopes : ["repo"];

      const token = await prisma.personalAccessToken.create({
        data: {
          name: name.trim(),
          tokenHash,
          prefix,
          userId: user.userId,
          scopes: validScopes,
          expiresAt,
        },
      });

      // Fetch username for the clone URL hint
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { username: true },
      });

      return reply.code(201).send({
        id: token.id,
        name: token.name,
        token: rawToken, // ⚠️ Only shown ONCE — never stored in plaintext
        prefix: token.prefix,
        scopes: token.scopes,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        usage: {
          note: "Make sure to copy your personal access token now. You won't be able to see it again! Use this token as your password when performing Git CLI operations over HTTPS.",
        },
      });
    },
  );

  // ── List all tokens for the current user ──
  // GET /api/v1/auth/tokens
  fastify.get(
    "/auth/tokens",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const tokens = await prisma.personalAccessToken.findMany({
        where: { userId: user.userId },
        select: {
          id: true,
          name: true,
          prefix: true,
          scopes: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Add expired flag
      const now = new Date();
      const enriched = tokens.map((t) => ({
        ...t,
        isExpired: t.expiresAt ? t.expiresAt < now : false,
        maskedToken: `${t.prefix}${"•".repeat(35)}`,
      }));

      return { tokens: enriched };
    },
  );

  // ── Revoke (delete) a token ──
  // DELETE /api/v1/auth/tokens/:id
  fastify.delete(
    "/auth/tokens/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      if (!user) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };

      // Ensure the token belongs to the current user
      const token = await prisma.personalAccessToken.findFirst({
        where: { id, userId: user.userId },
      });

      if (!token) {
        return reply.code(404).send({ error: "Token not found" });
      }

      await prisma.personalAccessToken.delete({ where: { id } });

      return { success: true, message: `Token "${token.name}" has been revoked.` };
    },
  );
}
