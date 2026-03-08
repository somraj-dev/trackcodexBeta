import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../middleware/auth";
import { searchService } from "../../services/infra/searchService";

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || "https://bumpy-snakes-guess.loca.lt";

/**
 * Try to search via ElasticSearch. Returns results array or throws on failure.
 * Uses a 3-second timeout so we don't block the user if ES is down.
 */
async function tryElasticSearch(query: string): Promise<any[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const indicesString = "*users,*repositories,*jobs,*workspaces";

    const esRes = await fetch(`${ELASTICSEARCH_URL}/${indicesString}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "trackcodex-backend",
      },
      signal: controller.signal,
      body: JSON.stringify({
        query: {
          multi_match: {
            query,
            fields: [
              "payload.name^3",
              "payload.username^2",
              "payload.email^2",
              "payload.title^3",
              "payload.description",
            ],
            fuzziness: "AUTO",
          },
        },
        size: 20,
      }),
    });

    if (!esRes.ok) {
      throw new Error(`ES error ${esRes.status}`);
    }

    const result = await esRes.json();
    const hits = result.hits?.hits || [];

    if (hits.length === 0) return [];

    const results: any[] = [];

    hits.forEach((hit: any) => {
      const source = hit._source?.payload || hit._source;
      const indexName = hit._index;

      if (indexName.includes("users")) {
        results.push({
          id: `user-${source.id}`,
          type: "user",
          label: source.name || source.username || "User",
          subLabel: source.username ? `@${source.username}` : undefined,
          icon: "person",
          group: "People",
          url: `/profile/${source.username}`,
        });
      } else if (indexName.includes("repositories")) {
        results.push({
          id: `repo-${source.id}`,
          type: "repo",
          label: source.name,
          subLabel: source.description,
          icon: "book",
          group: "Repositories",
          url: `/repo/${source.id}`,
        });
      } else if (indexName.includes("jobs")) {
        results.push({
          id: `job-${source.id}`,
          type: "job",
          label: source.title,
          subLabel: `${source.type || "Job"} - ${source.budget || ""}`,
          icon: "work",
          group: "Jobs",
          url: `/jobs/${source.id}`,
        });
      } else if (indexName.includes("workspaces")) {
        results.push({
          id: `ws-${source.id}`,
          type: "workspace",
          label: source.name,
          subLabel: source.status,
          icon: "terminal",
          group: "Workspaces",
          url: `/workspace/${source.id}`,
        });
      }
    });

    return results;
  } finally {
    clearTimeout(timeout);
  }
}

// Shared prisma instance

export async function searchRoutes(fastify: FastifyInstance) {
  // Global Search Endpoint
  // GET /api/v1/search?q=query
  fastify.get(
    "/search",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { q } = request.query as { q: string };
      const user = (request as any).user;

      if (!q || q.length < 2) {
        return { results: [] };
      }

      const query = q.toLowerCase();

      try {
        // ── Strategy: Try ElasticSearch first, fallback to Prisma ──
        let esResults: any[] | null = null;

        try {
          esResults = await tryElasticSearch(q);
        } catch (esError) {
          // ES failed — silently fall through to Prisma
          request.log.warn({ esError }, "ElasticSearch unavailable, using Prisma fallback");
        }

        // If ES returned results, merge with org search and return
        if (esResults && esResults.length > 0) {
          // Add orgs from Prisma (ES may not index them)
          const orgs = await prisma.organization.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            take: 3,
            select: { id: true, name: true },
          });

          const finalResults = [
            ...esResults,
            ...orgs.map((o) => ({
              id: `org-${o.id}`,
              type: "org",
              label: o.name,
              icon: "domain",
              group: "Organizations",
              url: `/org/${o.id}`,
            })),
          ];

          return { results: finalResults };
        }

        // ── Prisma fallback (reliable, always works) ──
        const searchData = await searchService.globalSearch(q, user?.userId, 10);
        const results: any[] = [];

        // Map users
        searchData.owners.forEach((owner) => {
          results.push({
            id: `user-${owner.id}`,
            type: "user",
            label: owner.name || owner.username || "User",
            subLabel: `@${owner.username}`,
            icon: "person",
            group: "People",
            url: `/profile/${owner.username}`,
          });
        });

        // Map repositories
        searchData.repositories.forEach((repo) => {
          results.push({
            id: `repo-${repo.id}`,
            type: "repo",
            label: repo.fullName || repo.name,
            subLabel: repo.description || `${repo.language || "Code"} • ★ ${repo.stars}`,
            icon: "book",
            group: "Repositories",
            url: `/repo/${repo.id}`,
          });
        });

        // Search jobs
        const jobs = await prisma.job.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          select: { id: true, title: true, type: true, budget: true },
        });

        jobs.forEach((job) => {
          results.push({
            id: `job-${job.id}`,
            type: "job",
            label: job.title,
            subLabel: `${job.type || "Job"} - ${job.budget || ""}`,
            icon: "work",
            group: "Jobs",
            url: `/jobs/${job.id}`,
          });
        });

        // Search workspaces
        const workspaces = await prisma.workspace.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
            ],
            ownerId: user?.userId,
          },
          take: 5,
          select: { id: true, name: true, status: true },
        });

        workspaces.forEach((ws) => {
          results.push({
            id: `ws-${ws.id}`,
            type: "workspace",
            label: ws.name,
            subLabel: ws.status,
            icon: "terminal",
            group: "Workspaces",
            url: `/workspace/${ws.id}`,
          });
        });

        // Search organizations
        const orgs = await prisma.organization.findMany({
          where: { name: { contains: query, mode: "insensitive" } },
          take: 3,
          select: { id: true, name: true },
        });

        orgs.forEach((o) => {
          results.push({
            id: `org-${o.id}`,
            type: "org",
            label: o.name,
            icon: "domain",
            group: "Organizations",
            url: `/org/${o.id}`,
          });
        });

        return { results };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Search failed" });
      }
    },
  );

  // Code Search (Raven Engine)
  // GET /api/v1/search/code?q=UserService
  fastify.get(
    "/search/code",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { q } = request.query as { q: string };

      if (!q || q.length < 2) {
        return { results: [] };
      }

      try {
        const symbols = await prisma.codeSymbol.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { path: { contains: q, mode: "insensitive" } },
            ],
          },
          include: { repo: true },
          take: 20,
        });

        const results = symbols.map((s) => ({
          id: `symbol-${s.id}`,
          type: "code",
          label: s.name,
          subLabel: `${s.repo.name} • ${s.path} • Line ${s.line}`,
          icon:
            s.type === "CLASS"
              ? "token"
              : s.type === "FUNCTION"
                ? "function"
                : "code",
          group: "Code Symbols",
          url: `/repo/${s.repoId}/blob/main/${s.path}#L${s.line}`,
          metadata: {
            signature: s.signature,
            type: s.type,
          },
        }));

        return { results };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Code search failed" });
      }
    },
  );

  // GitHub-style recent repositories
  fastify.get(
    "/search/recent",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;

      try {
        // Fetch recently updated repos the user owns as a "recent" proxy
        const repos = await prisma.repository.findMany({
          where: { ownerId: user.userId },
          select: {
            id: true,
            name: true,
            owner: {
              select: { username: true },
            },
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        });

        const recent = repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: `${repo.owner.username}/${repo.name}`,
          owner: repo.owner.username,
          lastVisited: repo.updatedAt,
        }));

        return { success: true, recent };
      } catch (error) {
        request.log.error(error);
        return reply
          .code(500)
          .send({ error: "Failed to fetch recent repositories" });
      }
    },
  );

  // Submit feedback
  fastify.post("/search/feedback", async (request, reply) => {
    const userId = (request as any).user?.userId;
    const { message, category, url } = request.body as {
      message: string;
      category?: string;
      url?: string;
    };

    if (!message || message.trim().length === 0) {
      return reply.code(400).send({
        success: false,
        error: "Feedback message is required",
      });
    }

    try {
      fastify.log.info({
        type: "user_feedback",
        userId,
        message,
        category,
        url,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: "Thank you for your feedback!",
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to submit feedback",
      });
    }
  });
}
