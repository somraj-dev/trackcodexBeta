import { FastifyInstance } from "fastify";
import { contributionStatsService } from "../../services/activity/contributionStatsService";
import { prisma } from "../../services/infra/prisma";

export default async function statsRoutes(fastify: FastifyInstance) {
  // Get contribution graph for a year
  fastify.get("/contributions/:userId", async (request, reply) => {
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
      const contributions = await contributionStatsService.getContributionGraph(
        userId,
        yearNum,
      );
      return { contributions };
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




