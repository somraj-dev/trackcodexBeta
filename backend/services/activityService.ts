import { prisma } from "./prisma";

// Shared prisma instance

/**
 * Integravity Activity Service
 * Centralized aggregator for collaboration events (GitHub-style activity stream).
 */
export class ActivityService {
  /**
   * Logs a new activity event.
   */
  static async log(data: {
    type: string;
    actorId: string;
    orgId?: string;
    repoId?: string;
    details?: any;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the actual Activity record
      const activity = await tx.activity.create({
        data: {
          type: data.type,
          actorId: data.actorId,
          orgId: data.orgId,
          repoId: data.repoId,
          details: data.details,
        },
      });

      // 2. Queue it for Elasticsearch mapping via the Outbox Worker
      await tx.outboxEvent.create({
        data: {
          topic: "activity", // Matches the indexName the ES Service expects
          payload: activity,
        },
      });

      return activity;
    });
  }

  /**
   * Fetch activity for a specific repository.
   */
  static async getRepoActivity(repoId: string, limit = 20) {
    return await prisma.activity.findMany({
      where: { repoId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Fetch activity for an entire organization.
   */
  static async getOrgActivity(orgId: string, limit = 50) {
    return await prisma.activity.findMany({
      where: { orgId },
      include: { actor: true, repo: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
