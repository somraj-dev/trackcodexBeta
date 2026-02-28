import { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma";
import { requireAuth } from "../middleware/auth";
import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://10.12.209.110:9200",
  headers: {
    'Bypass-Tunnel-Reminder': 'true',
    'User-Agent': 'trackcodex-backend'
  }
});

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
        // Query ElasticSearch across all indices we populated via the Outbox
        // The indices created by Debezium/Outbox connector follow the pattern server1.public.tablename
        const response = await esClient.search({
          index: "server1.public.users,server1.public.repositories,server1.public.jobs,server1.public.workspaces",
          ignore_unavailable: true,
          body: {
            query: {
              multi_match: {
                query: query,
                fields: [
                  "payload.name^3",
                  "payload.username^3",
                  "payload.email",
                  "payload.title^2",
                  "payload.description"
                ],
                fuzziness: "AUTO"
              }
            },
            size: 20
          }
        });

        const hits = response.hits.hits;
        const results: any[] = [];

        hits.forEach((hit: any) => {
          const source = hit._source.payload || hit._source;
          const indexName = hit._index;

          if (indexName.includes('users')) {
            results.push({
              id: `user-${source.id}`,
              type: "user",
              label: source.name || source.username || "User",
              subLabel: source.username,
              icon: "person",
              group: "People",
              url: `/profile/${source.username}`,
            });
          } else if (indexName.includes('repositories')) {
            results.push({
              id: `repo-${source.id}`,
              type: "repo",
              label: source.name,
              subLabel: source.description,
              icon: "book",
              group: "Repositories",
              url: `/repo/${source.id}`,
            });
          } else if (indexName.includes('jobs')) {
            results.push({
              id: `job-${source.id}`,
              type: "job",
              label: source.title,
              subLabel: `${source.type} - ${source.budget}`,
              icon: "work",
              group: "Jobs",
              url: `/jobs/${source.id}`,
            });
          } else if (indexName.includes('workspaces')) {
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

        // Add a manual org fetch just in case we missed org Outbox mapping
        const orgs = await prisma.organization.findMany({
          where: { name: { contains: query, mode: "insensitive" } },
          take: 3,
          select: { id: true, name: true },
        });

        const finalResults = [
          ...results,
          ...orgs.map((o) => ({
            id: `org-${o.id}`,
            type: "org",
            label: o.name,
            icon: "domain",
            group: "Organizations",
            url: `/org/${o.id}`,
          }))
        ];

        return { results: finalResults };
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
        const recentActivities = await prisma.activity.findMany({
          where: {
            userId: user.userId,
            type: {
              in: ["view_repository", "clone", "commit", "push"],
            },
            repositoryId: {
              not: null,
            },
          },
          select: {
            repository: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          distinct: ["repositoryId"],
        });

        const recent = recentActivities
          .filter((a) => a.repository)
          .map((a) => ({
            id: a.repository!.id,
            name: a.repository!.name,
            fullName: `${a.repository!.owner.username}/${a.repository!.name}`,
            owner: a.repository!.owner.username,
            lastVisited: a.createdAt,
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
