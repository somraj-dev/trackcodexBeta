import { FastifyInstance } from "fastify";
import { contributionStatsService } from "../../services/activity/contributionStatsService";
import { prisma } from "../../services/infra/prisma";

export default async function statsRoutes(fastify: FastifyInstance) {
  // Get contribution graph for a year
  fastify.get("/contributions/:userId", async (request, reply) => {
    let { userId } = request.params as { userId: string };
    const { year } = request.query as { year?: string };

    let userDateCreated = new Date();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userId, mode: "insensitive" } },
        select: { id: true, createdAt: true }
      });
      if (user) {
        userId = user.id;
        userDateCreated = user.createdAt;
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      });
      if (user) {
        userDateCreated = user.createdAt;
      }
    }

    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const joinYear = userDateCreated.getFullYear();
    const activeYears = Array.from({ length: Math.max(1, currentYear - joinYear + 1) }, (_, i) => currentYear - i);

    console.log(`[STATS] Fetching contribution graph for user: ${userId}, year: ${yearNum}`);

    try {
      const contributions = await contributionStatsService.getContributionGraph(
        userId,
        yearNum,
      );
      
      // Calculate total for the frontend
      const total = contributions.reduce((sum: any, day: any) => sum + day.count, 0);
      
      return { contributions, total, activeYears };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        error: "Failed to fetch contribution graph",
        message: error.message,
      });
    }
  });

  // Get commit streak
  fastify.get("/streak/:userId", async (request, reply) => {
    let { userId } = request.params as { userId: string };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userId, mode: "insensitive" } },
        select: { id: true }
      });
      if (user) userId = user.id;
    }

    try {
      const streak = await contributionStatsService.getStreak(userId);
      return { streak };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        error: "Failed to fetch streak",
        message: error.message,
      });
    }
  });

  // Get total contributions for a year
  fastify.get("/total/:userId", async (request, reply) => {
    let { userId } = request.params as { userId: string };
    const { year } = request.query as { year?: string };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userId, mode: "insensitive" } },
        select: { id: true }
      });
      if (user) userId = user.id;
    }

    const yearNum = year ? parseInt(year) : new Date().getFullYear();

    try {
      const total = await contributionStatsService.getTotalContributions(
        userId,
        yearNum,
      );
      return { total, year: yearNum };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        error: "Failed to fetch total contributions",
        message: error.message,
      });
    }
  });
}




