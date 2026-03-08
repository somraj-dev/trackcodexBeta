/**
 * Radar Aggregation Engine — Layer 2
 *
 * Single responsibility:
 *   1. Listen to domain score updates
 *   2. Recalculate 5 radar axes using weighted formulas
 *   3. Store final radar state
 *   4. Record history snapshots
 *   5. Apply decay on inactivity
 *
 * DESIGN RULE: This engine NEVER knows domain internals.
 * It only consumes normalized 0-100 scores from domain tables.
 */
import { prisma } from "../infra/prisma";
import { EventEmitter } from "events";

// Shared prisma instance

// ─── Axis Definitions ────────────────────────────────────────────
export const RADAR_AXES = [
    "SECURE_ENGINEERING",
    "APPLIED_SECURITY",
    "PROFESSIONAL_RELIABILITY",
    "ENGINEERING_DEPTH",
    "SECURITY_LEADERSHIP",
] as const;

export type RadarAxis = (typeof RADAR_AXES)[number];

// ─── Event Bus ───────────────────────────────────────────────────
export const radarEventBus = new EventEmitter();
radarEventBus.setMaxListeners(20);

// ─── Aggregation Engine ──────────────────────────────────────────
export class RadarService {
    constructor() {
        // Listen for domain score update events
        radarEventBus.on("domain:updated", async (userId: string) => {
            try {
                await this.recalculate(userId);
            } catch (err) {
                console.error(`❌ [Radar] Failed to recalculate for ${userId}:`, err);
            }
        });
    }

    /**
     * Full recalculation pipeline:
     *  1. Pull all domain scores
     *  2. Compute weighted axes
     *  3. Store to UserRadarState
     *  4. Snapshot to RadarHistory
     *  5. Emit event for governance evaluation
     */
    async recalculate(userId: string): Promise<RadarState> {
        // 1. Pull domain scores (Layer 1 outputs) from the unified table
        const scores = await prisma.domainScore.findMany({
            where: { userId }
        });

        // Map unified scores back to domain-specific structures for calculation
        const r: Record<string, number> = {};
        const m: Record<string, number> = {};
        const o: Record<string, number> = {};

        for (const s of scores) {
            if (s.domain === "REPOSITORY") r[s.axis] = s.score;
            if (s.domain === "MARKETPLACE") m[s.axis] = s.score;
            if (s.domain === "OSS") o[s.axis] = s.score;
        }

        // Default missing scores to 0
        const repo = {
            secureCodingScore: r.secureCodingScore ?? 0,
            fixSpeedScore: r.fixSpeedScore ?? 0,
            riskManagementScore: r.riskManagementScore ?? 0,
            consistencyScore: r.consistencyScore ?? 0,
        };
        const marketplace = {
            professionalReliabilityScore: m.professionalReliabilityScore ?? 0,
            deliveryDisciplineScore: m.deliveryDisciplineScore ?? 0,
            appliedSecurityScore: m.appliedSecurityScore ?? 0,
        };
        const oss = {
            engineeringDepthScore: o.engineeringDepthScore ?? 0,
            securityLeadershipScore: o.securityLeadershipScore ?? 0,
            ossImpactScore: o.ossImpactScore ?? 0,
        };

        // 2. Weighted aggregation formulas
        const axes: Record<RadarAxis, number> = {
            SECURE_ENGINEERING: this.clamp(
                0.7 * repo.secureCodingScore +
                0.2 * repo.consistencyScore +
                0.1 * oss.securityLeadershipScore
            ),
            APPLIED_SECURITY: this.clamp(
                0.6 * marketplace.appliedSecurityScore +
                0.4 * repo.secureCodingScore
            ),
            PROFESSIONAL_RELIABILITY: this.clamp(
                0.7 * marketplace.professionalReliabilityScore +
                0.3 * marketplace.deliveryDisciplineScore
            ),
            ENGINEERING_DEPTH: this.clamp(
                0.6 * oss.engineeringDepthScore +
                0.4 * oss.ossImpactScore
            ),
            SECURITY_LEADERSHIP: this.clamp(
                0.5 * oss.securityLeadershipScore +
                0.3 * marketplace.appliedSecurityScore +
                0.2 * repo.riskManagementScore
            ),
        };

        // 3. Store to UserRadarState (one row per axis)
        const upserts = RADAR_AXES.map((axis) =>
            prisma.userRadarState.upsert({
                where: { userId_axisName: { userId, axisName: axis } },
                create: { userId, axisName: axis, axisScore: axes[axis] },
                update: { axisScore: axes[axis] },
            })
        );
        await Promise.all(upserts);

        // 4. Snapshot to RadarHistory
        const historyEntries = RADAR_AXES.map((axis) => ({
            userId,
            axisName: axis,
            score: axes[axis],
        }));
        await prisma.radarHistory.createMany({ data: historyEntries });

        // 5. Emit for governance
        radarEventBus.emit("radar:recalculated", userId, axes);

        return { userId, axes };
    }

    /**
     * Decay mechanism — apply 2% decay per 30 days of inactivity.
     * Should be run on a cron schedule (e.g., daily).
     */
    async applyDecay(): Promise<number> {
        const DECAY_RATE = 0.98;
        const INACTIVITY_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
        const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_MS);

        // Find stale radar states
        const staleStates = await prisma.userRadarState.findMany({
            where: { lastUpdated: { lt: cutoff } },
        });

        if (staleStates.length === 0) return 0;

        // Apply decay
        const updates = staleStates.map((state) =>
            prisma.userRadarState.update({
                where: { id: state.id },
                data: { axisScore: Math.max(0, state.axisScore * DECAY_RATE) },
            })
        );
        await Promise.all(updates);

        console.warn(
            `📉 [Radar] Applied decay to ${staleStates.length} stale axis scores`
        );
        return staleStates.length;
    }

    /**
     * Get complete radar state for a user (5 axes).
     */
    async getUserRadar(userId: string): Promise<RadarState | null> {
        const states = await prisma.userRadarState.findMany({
            where: { userId },
        });

        if (states.length === 0) return null;

        const axes: Record<string, number> = {};
        for (const s of states) {
            axes[s.axisName] = s.axisScore;
        }

        return { userId, axes: axes as Record<RadarAxis, number> };
    }

    /**
     * Get radar history for trend graphs.
     */
    async getHistory(userId: string, days = 90) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return prisma.radarHistory.findMany({
            where: { userId, recordedAt: { gte: since } },
            orderBy: { recordedAt: "asc" },
        });
    }

    /**
     * Get all domain scores (raw Layer 1 data).
     */
    async getDomainScores(userId: string) {
        const scores = await prisma.domainScore.findMany({
            where: { userId }
        });

        const r: Record<string, number> = {};
        const m: Record<string, number> = {};
        const o: Record<string, number> = {};

        for (const s of scores) {
            if (s.domain === "REPOSITORY") r[s.axis] = s.score;
            if (s.domain === "MARKETPLACE") m[s.axis] = s.score;
            if (s.domain === "OSS") o[s.axis] = s.score;
        }

        return { repository: r, marketplace: m, oss: o };
    }

    private clamp(v: number): number {
        return Math.min(100, Math.max(0, v));
    }
}

export interface RadarState {
    userId: string;
    axes: Record<RadarAxis, number>;
}

export const radarService = new RadarService();





