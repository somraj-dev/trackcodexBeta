import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { searchService } from "../../services/infra/searchService";
import { meilisearchClient } from "../../services/infra/meilisearch";

/**
 * Try to search via Meilisearch. Returns results array or throws on failure.
 */
async function tryMeilisearch(query: string): Promise<any[]> {
  const [usersRes, reposRes, workspacesRes] = await Promise.all([
    meilisearchClient.index('trackcodex_users').search(query, { limit: 5 }),
    meilisearchClient.index('trackcodex_repositories').search(query, { limit: 5, filter: "visibility = 'public'" }),
    meilisearchClient.index('trackcodex_workspaces').search(query, { limit: 3 }),
  ]);

  const results: any[] = [];

  usersRes.hits.forEach((hit: any) => {
    results.push({
      id: `user-${hit.id}`,
      type: "user",
      label: hit.name || hit.username || "User",
      subLabel: hit.username ? `@${hit.username}` : undefined,
      icon: "person",
      group: "People",
      url: `/profile/${hit.username}`,
      metadata: {
        avatar: hit.avatar,
        username: hit.username,
      },
    });
  });

  reposRes.hits.forEach((hit: any) => {
    results.push({
      id: `repo-${hit.id}`,
      type: "repo",
      label: hit.name,
      subLabel: hit.description,
      icon: "book",
      group: "Repositories",
      url: `/repo/${hit.id}`,
    });
  });

  workspacesRes.hits.forEach((hit: any) => {
    results.push({
      id: `ws-${hit.id}`,
      type: "workspace",
      label: hit.name,
      subLabel: hit.status,
      icon: "terminal",
      group: "Workspaces",
      url: `/workspace/${hit.id}`,
    });
  });

  return results;
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
        // ── Strategy: Try Meilisearch first, fallback to Prisma ──
        try {
          let msResults = await tryMeilisearch(q);
          if (type) {
            msResults = msResults.filter(
              r => r.type === type || (type === "repositories" && r.type === "repo")
            );
          }
          if (msResults.length > 0) return { results: msResults };
        } catch (msError: any) {
          request.log.warn({ error: msError.message }, "Meilisearch fetch failed, falling back to Prisma");
        }


        // ── Prisma fallback (sophisticated filtering) ──
        const results: any[] = [];

        // ── 1. Fast User Search ──
        // Uses OR with startsWith for prefix B-tree scan (O(log n) on indexed columns)
        // Falls back to contains only when query is short and prefix might miss results
        if (!type || type === "users") {
          const q_lower = q.trim().toLowerCase();
          const words = q_lower.split(/\s+/).filter(Boolean);

          const buildWordClauses = (word: string) => [
            { username: { startsWith: word, mode: "insensitive" as const } },
            { name: { startsWith: word, mode: "insensitive" as const } },
            { username: { contains: word, mode: "insensitive" as const } },
            { name: { contains: word, mode: "insensitive" as const } },
          ];

          const userWhere: any = {
            deletedAt: null,
            accountLocked: false,
            AND: words.map((w) => ({ OR: buildWordClauses(w) })),
          };

          // Prefix matches first (Instagram-style ordering)
          const prefixWhere: any = {
            deletedAt: null,
            accountLocked: false,
            OR: words.flatMap((w) => [
              { username: { startsWith: w, mode: "insensitive" as const } },
              { name: { startsWith: w, mode: "insensitive" as const } },
            ]),
          };

          const [prefixUsers, containsUsers] = await Promise.all([
            prisma.user.findMany({ where: prefixWhere, select: { id: true, name: true, username: true, avatar: true, profile: { select: { bio: true, location: true, followersCount: true } } }, take: type === "users" ? 15 : 5, orderBy: { name: "asc" } }),
            prisma.user.findMany({ where: userWhere, select: { id: true, name: true, username: true, avatar: true, profile: { select: { bio: true, location: true, followersCount: true } } }, take: type === "users" ? 30 : 5, orderBy: { name: "asc" } }),
          ]);

          const seen = new Set<string>();
          const users: typeof containsUsers = [];
          for (const u of [...prefixUsers, ...containsUsers]) {
            if (!seen.has(u.id)) { seen.add(u.id); users.push(u); }
          }

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

  // ── Dedicated User Search with Meilisearch + Prisma fallback ──
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

      if (!q || q.trim().length < 1) {
        return { users: [], total: 0 };
      }

      const page = Math.max(1, parseInt(pageStr || "1", 10));
      const limit = Math.min(50, parseInt(limitStr || "20", 10));
      const skip = (page - 1) * limit;
      const q_lower = q.toLowerCase();

      try {
        // ── 1. Try Meilisearch first ──
        try {
          const msRes = await meilisearchClient.index('trackcodex_users').search(q, {
            limit,
            offset: skip,
          });

          if (msRes.hits.length > 0) {
            const users = msRes.hits.map((hit: any) => ({
              id: hit.id,
              name: hit.name || hit.username || "User",
              username: hit.username,
              avatar: hit.avatar,
              url: `/profile/${hit.username}`,
            }));
            return { users, total: msRes.estimatedTotalHits || msRes.hits.length, source: "meilisearch" };
          }
        } catch (msErr: any) {
          request.log.warn({ error: msErr.message }, "[search/users] Meilisearch failed, using Prisma fallback");
        }

        // ── 2. Optimised Prisma fallback (Instagram-style) ──
        // Priority 1: prefix match on username/name (startsWith)
        // Priority 2: contains match anywhere in username/name
        // Multi-word support: "vatsal bh" -> split by spaces and match all tokens
        const q_trimmed = q_lower.trim();
        const words = q_trimmed.split(/\s+/).filter(Boolean);

        // Build OR conditions for all words across all fields
        const buildWordClauses = (word: string) => [
          { username: { startsWith: word, mode: "insensitive" as const } },
          { name: { startsWith: word, mode: "insensitive" as const } },
          { username: { contains: word, mode: "insensitive" as const } },
          { name: { contains: word, mode: "insensitive" as const } },
        ];

        // Single-word: OR all conditions. Multi-word: each word must appear somewhere.
        const whereClause: any = {
          deletedAt: null,
          accountLocked: false,
          AND: words.map((w) => ({ OR: buildWordClauses(w) })),
        };

        // Run two queries: startsWith (prefix) first for relevance ordering
        const prefixWhere: any = {
          deletedAt: null,
          accountLocked: false,
          OR: words.flatMap((w) => [
            { username: { startsWith: w, mode: "insensitive" as const } },
            { name: { startsWith: w, mode: "insensitive" as const } },
          ]),
        };

        const [prefixUsers, containsUsers, total] = await Promise.all([
          prisma.user.findMany({
            where: prefixWhere,
            select: {
              id: true, name: true, username: true, avatar: true,
              profile: { select: { bio: true, location: true, followersCount: true } },
              _count: { select: { followers: true } },
            },
            take: limit,
            orderBy: [{ name: "asc" }],
          }),
          prisma.user.findMany({
            where: whereClause,
            select: {
              id: true, name: true, username: true, avatar: true,
              profile: { select: { bio: true, location: true, followersCount: true } },
              _count: { select: { followers: true } },
            },
            skip,
            take: limit,
            orderBy: [{ name: "asc" }],
          }),
          prisma.user.count({ where: whereClause }),
        ]);

        // Merge: prefix matches first, then contains, deduplicate by id
        const seen = new Set<string>();
        const mergedUsers: typeof containsUsers = [];
        for (const u of [...prefixUsers, ...containsUsers]) {
          if (!seen.has(u.id)) {
            seen.add(u.id);
            mergedUsers.push(u);
          }
        }
        const users = mergedUsers.slice(0, limit);

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




