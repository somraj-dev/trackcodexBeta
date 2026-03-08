/**
 * Radar Engine API Routes
 *
 * Endpoints:
 *   GET  /radar/:userId           — Full 5-axis radar state
 *   GET  /radar/:userId/history   — Historical snapshots for trend graph
 *   GET  /radar/:userId/domains   — All 3 domain scores
 *   GET  /radar/governance/:userId — Current permissions from rules
 *   GET  /radar/governance/rules  — List all governance rules
 *   POST /radar/event             — Trigger domain recalculation (internal)
 *   POST /radar/decay             — Trigger decay (admin/cron)
 *   POST /radar/governance/seed   — Seed default governance rules
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../services/infra/prisma";

export async function radarRoutes(fastify: FastifyInstance) {
    // ─── GET /radar/:userId — Full 5-axis radar state ────────────
    fastify.get("/radar/:userId", async (request: FastifyRequest) => {
        const { userId } = request.params as { userId: string };
        try {
            const { radarService } = await import("../services/radar/RadarService");
            // Shared prisma instance
            const data = await radarService.getUserRadar(userId);
            if (data) return data;
        } catch (e) {
            console.warn("Radar service unavailable, falling back to defaults", e);
        }

        // Fallback defaults
        return {
            userId,
            axes: {
                SECURE_ENGINEERING: 0,
                APPLIED_SECURITY: 0,
                PROFESSIONAL_RELIABILITY: 0,
                ENGINEERING_DEPTH: 0,
                SECURITY_LEADERSHIP: 0,
            },
        };
    });

    // ─── GET /radar/:userId/history — Historical trend data ──────
    fastify.get("/radar/:userId/history", async (request: FastifyRequest) => {
        const { userId } = request.params as { userId: string };
        const { days } = request.query as { days?: string };
        try {
            const { radarService } = await import("../services/radar/RadarService");
            return await radarService.getHistory(userId, days ? parseInt(days) : 90);
        } catch (e) {
            console.warn("Radar history unavailable", e);
            return [];
        }
    });

    // ─── GET /radar/:userId/domains — All domain scores ──────────
    fastify.get("/radar/:userId/domains", async (request: FastifyRequest) => {
        const { userId } = request.params as { userId: string };
        try {
            const { radarService } = await import("../services/radar/RadarService");
            return await radarService.getDomainScores(userId);
        } catch (e) {
            console.warn("Domain scores unavailable", e);
            return { repository: null, marketplace: null, oss: null };
        }
    });

    // ─── GET /radar/governance/:userId — Permissions ─────────────
    fastify.get("/radar/governance/:userId", async (request: FastifyRequest) => {
        const { userId } = request.params as { userId: string };
        try {
            const { governanceEngine } = await import("../services/radar/GovernanceEngine");
            return await governanceEngine.getPermissions(userId);
        } catch (e) {
            console.warn("Governance unavailable", e);
            return {
                canMerge: true,
                requiresMarketplaceApproval: false,
                rankingVisible: true,
                hasAdvancedReviewPrivileges: false,
                triggeredRules: [],
            };
        }
    });

    // ─── GET /radar/governance/rules — List all rules ────────────
    fastify.get("/radar/governance/rules", async () => {
        try {
            const { governanceEngine } = await import("../services/radar/GovernanceEngine");
            return await governanceEngine.listRules();
        } catch (e) {
            console.warn("Governance rules unavailable", e);
            return [];
        }
    });

    // ─── POST /radar/event — Trigger domain recalculation ────────
    fastify.post("/radar/event", async (request: FastifyRequest, reply: FastifyReply) => {
        const { userId, domain } = request.body as {
            userId: string;
            domain: "REPOSITORY" | "MARKETPLACE" | "OSS" | "ALL";
        };

        if (!userId) {
            return reply.code(400).send({ error: "userId is required" });
        }

        try {
            // Recalculate the specified domain
            if (domain === "REPOSITORY" || domain === "ALL") {
                const { repositorySecurityDomain } = await import(
                    "../services/radar/domains/RepositorySecurityDomain"
                );
                await repositorySecurityDomain.recalculate(userId);
            }
            if (domain === "MARKETPLACE" || domain === "ALL") {
                const { marketplaceDomain } = await import(
                    "../services/radar/domains/MarketplaceDomain"
                );
                await marketplaceDomain.recalculate(userId);
            }
            if (domain === "OSS" || domain === "ALL") {
                const { ossContributionDomain } = await import(
                    "../services/radar/domains/OssContributionDomain"
                );
                await ossContributionDomain.recalculate(userId);
            }

            // Trigger radar aggregation
            const { radarEventBus } = await import("../services/radar/RadarService");
            radarEventBus.emit("domain:updated", userId);

            return { success: true, message: `Recalculation triggered for ${domain} domain(s)` };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            console.error("Radar event processing failed:", e);
            return reply.code(500).send({ error: message });
        }
    });

    // ─── POST /radar/decay — Trigger decay (admin/cron) ──────────
    fastify.post("/radar/decay", async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { radarService } = await import("../services/radar/RadarService");
            const decayed = await radarService.applyDecay();
            return { success: true, decayedCount: decayed };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            return reply.code(500).send({ error: message });
        }
    });

    // ─── POST /radar/governance/seed — Seed default rules ────────
    fastify.post("/radar/governance/seed", async (_request: FastifyRequest) => {
        try {
            const { governanceEngine } = await import("../services/radar/GovernanceEngine");
            await governanceEngine.seedDefaultRules();
            return { success: true, message: "Default governance rules seeded" };
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            return { success: false, error: message };
        }
    });
}
