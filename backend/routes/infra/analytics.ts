import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { AppError } from "../../utils/AppError";
import { requireAuth } from "../../middleware/auth";

export async function analyticsRoutes(fastify: FastifyInstance) {
  
  // ─── INGEST METRICS (Public/Worker with token) ────────────────
  // This is called by the Cloudflare Worker after every request.
  // To keep it high-performance, we use a simple aggregation.
  fastify.post("/analytics/ingest", async (request, reply) => {
    const { 
      projectId, 
      status, 
      latency, 
      bandwidth, 
      method,
      secret
    } = request.body as any;

    // Basic security check (shared secret between worker and backend)
    if (secret !== process.env.ANALYTICS_INGEST_SECRET) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    if (!projectId) {
      return reply.code(400).send({ error: "projectId is required" });
    }

    // Determine the current hour (start of the hour)
    const now = new Date();
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    try {
      // Find or create the metric record for this hour
      // We use upsert with increments where possible
      const isError = status >= 400 ? 1 : 0;
      
      // We'll update the JSON statusCodes map as well
      // Note: Prisma 5+ supports atomic JSON updates on some databases, but for simplicity
      // and compatibility with PostgreSQL, we might need a raw query for complex JSON or just read-modify-write.
      // For now, let's stick to increments for the main counters.

      await (prisma as any).projectMetric.upsert({
        where: {
          projectId_timestamp: {
            projectId,
            timestamp: startOfHour
          }
        },
        update: {
          requests: { increment: 1 },
          errors: { increment: isError },
          bandwidth: { increment: BigInt(bandwidth || 0) },
          // Approximating average latency: (avgLatency * (requests - 1) + latency) / requests
          // Since we use increment, we can't easily do this in one atomic call with Prisma.
          // For now, we'll store the raw sum in avgLatency and divide by requests on read, 
          // OR just update it slightly inaccurately. 
          // Better: just overwrite it for now until we have a proper aggregator.
          avgLatency: { increment: latency || 0 } 
        },
        create: {
          projectId,
          timestamp: startOfHour,
          requests: 1,
          errors: isError,
          bandwidth: BigInt(bandwidth || 0),
          avgLatency: latency || 0,
          statusCodes: JSON.stringify({ [status]: 1 })
        }
      });

      return { success: true };
    } catch (err: any) {
      request.log.error(`Analytics ingestion failed for ${projectId}: ${err.message}`);
      // Don't fail the request, just log it. We don't want to block the worker.
      return reply.code(200).send({ success: false, error: "Internal Error" });
    }
  });

  // ─── GET PROJECT METRICS (Authenticated) ──────────────────────
  fastify.get("/projects/:projectId/analytics", async (request) => {
    const { projectId } = request.params as any;
    const user = (request as any).user;
    
    // Verify ownership
    const project = await prisma.deployProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!project || project.ownerId !== user.userId) {
      throw new AppError("Forbidden", 403);
    }

    // Get last 24 hours of data
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const metrics = await prisma.projectMetric.findMany({
      where: {
        projectId,
        timestamp: { gte: twentyFourHoursAgo }
      },
      orderBy: { timestamp: "asc" }
    });

    // Process metrics (calculate real average from the sum stored in avgLatency)
    return metrics.map(m => ({
      timestamp: m.timestamp,
      requests: m.requests,
      errors: m.errors,
      bandwidth: m.bandwidth.toString(),
      avgLatency: m.requests > 0 ? Math.round(m.avgLatency / m.requests) : 0,
      statusCodes: m.statusCodes
    }));
  });

  // ─── GET SUMMARY STATS ────────────────────────────────────────
  fastify.get("/projects/:projectId/analytics/summary", async (request) => {
    const { projectId } = request.params as any;
    const user = (request as any).user;

    const project = await prisma.deployProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!project || project.ownerId !== user.userId) {
      throw new AppError("Forbidden", 403);
    }

    // Aggregate all-time or last 30 days
    const totalStats = await (prisma as any).projectMetric.aggregate({
      where: { projectId },
      _sum: {
        requests: true,
        errors: true,
        bandwidth: true,
        avgLatency: true
      }
    });

    const sumRequests = totalStats._sum.requests || 0;
    const sumLatency = totalStats._sum.avgLatency || 0;

    return {
      totalRequests: sumRequests,
      totalErrors: totalStats._sum.errors || 0,
      totalBandwidth: (totalStats._sum.bandwidth || BigInt(0)).toString(),
      avgLatency: sumRequests > 0 ? Math.round(Number(sumLatency) / sumRequests) : 0,
      errorRate: sumRequests > 0 ? ((totalStats._sum.errors || 0) / sumRequests * 100).toFixed(2) : "0"
    };
  });
}
