import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { searchService } from "../../services/infra/searchService";

// Only use ES when explicitly configured (not the placeholder/tunnel URL)
const ELASTICSEARCH_URL = (() => {
  const url = process.env.ELASTICSEARCH_URL || "";
  if (!url || url.includes("loca.lt") || url.includes("placeholder")) return null;
  return url;
})();

/**
 * Try to search via ElasticSearch. Returns results array or throws on failure.
 * Uses a 3-second timeout so we don't block the user if ES is down.
 */
async function tryElasticSearch(query: string): Promise<any[]> {
  if (!ELASTICSEARCH_URL) throw new Error("ES not configured");
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
          metadata: {
            avatar: source.avatar,
            bio: source.bio,
            location: source.location,
            followersCount: source.followersCount || 0,
            username: source.username,
          },
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
  // GET /api/v1/search?q=query&type=users
  fastify.get(
    "/search",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { q, type } = request.query as { q: string; type?: string };
      const user = (request as any).user;

      if (!q || q.length < 2) {
        return { results: [] };
      }

      const query = q; // Prisma mode: "insensitive" handles the original case

      try {
        // ── Strategy: Try ElasticSearch first, fallback to Prisma ──
        if (ELASTICSEARCH_URL) {
          try {
            let esResults = await tryElasticSearch(q);
            if (type) {
              esResults = esResults.filter(
                r => r.type === type || (type === "repositories" && r.type === "repo")
              );
            }
            if (esResults.length > 0) return { results: esResults };
          } catch (esError: any) {
            request.log.warn({ error: esError.message }, "ElasticSearch fetch failed, falling back to Prisma");
          }
        } else {
          request.log.info("Skipping ElasticSearch (not configured or local tunnel), using Prisma");
        }


        // ── Prisma fallback (sophisticated filtering) ──
        const results: any[] = [];

        // ── 1. Fast User Search ──
        // Uses OR with startsWith for prefix B-tree scan (O(log n) on indexed columns)
        // Falls back to contains only when query is short and prefix might miss results
        if (!type || type === "users") {
          const q_lower = q.trim();
          const users = await prisma.user.findMany({
            where: {
              deletedAt: null,
              accountLocked: false,
              isPrivate: false,
              OR: [
                { username: { contains: q_lower, mode: "insensitive" } },
                { name: { contains: q_lower, mode: "insensitive" } },
              ],
            },
            select: {
              id: true, name: true, username: true, avatar: true,
              profile: { select: { bio: true, location: true, followersCount: true } },
            },
            take: type === "users" ? 30 : 5,
            orderBy: { name: "asc" },
          });

          request.log.info({ q, userCount: users.length }, "Prisma user search");

          users.forEach((u) => {
            results.push({
              id: `user-${u.id}`,
              type: "user",
              label: u.name || u.username || "User",
              subLabel: `@${u.username}`,
              icon: "person",
              group: "People",
              url: `/profile/${u.username}`,
              metadata: {
                avatar: u.avatar,
                bio: u.profile?.bio,
                location: u.profile?.location,
                followersCount: u.profile?.followersCount || 0,
              },
            });
          });
        }

        // 2. Search Repositories
        if (!type || type === "repositories" || type === "repo") {
          const repos = await prisma.repository.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
              visibility: "PUBLIC",
            },
            include: { owner: true },
            take: type === "repositories" ? 30 : 5,
            orderBy: { stars: "desc" },
          });

          repos.forEach((repo) => {
            results.push({
              id: `repo-${repo.id}`,
              type: "repo",
              label: repo.name,
              subLabel: repo.description || `${repo.language || "Code"} • ★ ${repo.stars}`,
              icon: "book",
              group: "Repositories",
              url: `/repo/${repo.id}`,
              metadata: {
                owner: repo.owner?.username,
                stars: repo.stars,
                language: repo.language,
              }
            });
          });
        }

        // 3. Search Jobs
        if (!type || type === "jobs") {
          const jobs = await prisma.job.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            take: type === "jobs" ? 20 : 3,
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
        }

        // 4. Search Organizations
        if (!type || type === "orgs" || type === "organizations") {
          const orgs = await prisma.organization.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            take: 5,
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
        }

        return { results };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Search failed" });
      }
    },
  );

  // ── Dedicated User Search with Elasticsearch + Prisma fallback ──
  // GET /api/v1/search/users?q=query&page=1&limit=20
  fastify.get(
    "/search/users",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { q, page: pageStr, limit: limitStr } = request.query as {
        q: string;
        page?: string;
        limit?: string;
      };

      if (!q || q.length < 1) {
        return { users: [], total: 0 };
      }

      const page = Math.max(1, parseInt(pageStr || "1", 10));
      const limit = Math.min(50, parseInt(limitStr || "20", 10));
      const skip = (page - 1) * limit;
      const q_lower = q.toLowerCase();

      try {
        // ── 1. Try Elasticsearch first ──
        if (ELASTICSEARCH_URL) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const esRes = await fetch(
              `${ELASTICSEARCH_URL}/trackcodex.users/_search`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  "Bypass-Tunnel-Reminder": "true",
                  "User-Agent": "trackcodex-backend",
                },
                signal: controller.signal,
                body: JSON.stringify({
                  from: skip,
                  size: limit,
                  query: {
                    multi_match: {
                      query: q,
                      fields: ["payload.name^3", "payload.username^2", "payload.bio", "payload.location"],
                      fuzziness: "AUTO",
                    },
                  },
                }),
              }
            );
            clearTimeout(timeout);

            if (esRes.ok) {
              const result = await esRes.json();
              const hits = result.hits?.hits || [];
              const total = result.hits?.total?.value ?? hits.length;
              if (hits.length > 0) {
                const users = hits.map((hit: any) => {
                  const src = hit._source?.payload || hit._source;
                  return {
                    id: src.id,
                    name: src.name || src.username || "User",
                    username: src.username,
                    avatar: src.avatar,
                    bio: src.bio,
                    location: src.location,
                    followersCount: src.followersCount || 0,
                    url: `/profile/${src.username}`,
                  };
                });
                return { users, total, source: "elasticsearch" };
              }
            }
          } catch (esErr: any) {
            request.log.warn({ error: esErr.message }, "[search/users] Elasticsearch failed, using Prisma fallback");
          }
        }

        // ── 2. Optimised Prisma fallback ──
        // Single OR with both startsWith and contains (prefix scan first, covers suffix)
        const where = {
          deletedAt: null,
          accountLocked: false,
          isPrivate: false,
          OR: [
            { username: { contains: q_lower, mode: "insensitive" as const } },
            { name: { contains: q_lower, mode: "insensitive" as const } },
          ],
        };

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true, name: true, username: true, avatar: true,
              profile: { select: { bio: true, location: true, followersCount: true } },
              _count: { select: { followers: true } },
            },
            skip,
            take: limit,
            orderBy: { name: "asc" },
          }),
          prisma.user.count({ where }),
        ]);

        // If the current user is logged in, batch-check which result users they follow
        const currentUser = (request as any).user;
        let followingSet: Set<string> = new Set();
        if (currentUser?.userId && users.length > 0) {
          const follows = await prisma.follow.findMany({
            where: {
              followerId: currentUser.userId,
              followingId: { in: users.map((u) => u.id) },
            },
            select: { followingId: true },
          });
          followingSet = new Set(follows.map((f) => f.followingId));
        }

        return {
          users: users.map((u) => ({
            id: u.id,
            name: u.name || u.username || "User",
            username: u.username,
            avatar: u.avatar,
            bio: u.profile?.bio,
            location: u.profile?.location,
            // Use live count from Follow table (more accurate than cached profile counter)
            followersCount: (u as any)._count?.followers ?? u.profile?.followersCount ?? 0,
            isFollowing: followingSet.has(u.id),
            url: `/profile/${u.username}`,
          })),
          total,
          source: "prisma",
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "User search failed" });
      }
    }
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




