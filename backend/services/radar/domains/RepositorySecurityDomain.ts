/**
 * Repository Security Domain — Layer 1
 *
 * Inputs:  Scan results, fix times, repeated vulnerability history
 * Outputs: secure_coding_score, fix_speed_score, risk_management_score, consistency_score
 *
 * All scores normalized 0-100. Pushed via event system.
 */
import { prisma } from "../../prisma";

// Shared prisma instance

export class RepositorySecurityDomain {
    /**
     * Recalculate all repository security scores for a user.
     * Called after scan completion, vulnerability fix, or periodic recalc.
     */
    async recalculate(userId: string): Promise<RepositoryScores> {
        const scores = {
            secureCodingScore: await this.calcSecureCodingScore(userId),
            fixSpeedScore: await this.calcFixSpeedScore(userId),
            riskManagementScore: await this.calcRiskManagementScore(userId),
            consistencyScore: await this.calcConsistencyScore(userId),
        };

        // Persist each axis to the unified DomainScore table
        const upserts = Object.entries(scores).map(([axis, score]) =>
            prisma.domainScore.upsert({
                where: { userId_domain_axis: { userId, domain: "REPOSITORY", axis } },
                create: { userId, domain: "REPOSITORY", axis, score },
                update: { score },
            })
        );
        await Promise.all(upserts);

        return scores;
    }

    /**
     * Secure Coding Score (0-100)
     * Based on scan results: ratio of clean scans to total, severity weighting.
     */
    private async calcSecureCodingScore(userId: string): Promise<number> {
        const scans = await prisma.codeScan.findMany({
            where: { triggeredBy: userId, status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 20,
        });

        if (scans.length === 0) return 50; // Neutral baseline

        // Weight: critical=-20, high=-10, medium=-3, low=-1
        let totalPenalty = 0;
        for (const scan of scans) {
            totalPenalty +=
                scan.criticalCount * 20 +
                scan.highCount * 10 +
                scan.mediumCount * 3 +
                scan.lowCount * 1;
        }

        // Normalize: max penalty per scan ~50, so 20 scans = max 1000
        const avgPenalty = totalPenalty / scans.length;
        const score = Math.max(0, 100 - avgPenalty * 2);
        return this.clamp(score);
    }

    /**
     * Fix Speed Score (0-100)
     * How fast vulnerabilities are remediated after detection.
     */
    private async calcFixSpeedScore(userId: string): Promise<number> {
        const fixedVulns = await prisma.vulnerability.findMany({
            where: {
                scan: { triggeredBy: userId },
                status: "FIXED",
                fixedInCommit: { not: null },
            },
            include: { scan: true },
            orderBy: { updatedAt: "desc" },
            take: 30,
        });

        if (fixedVulns.length === 0) return 50;

        // Average fix time in hours
        const fixTimes = fixedVulns.map((v) => {
            const detected = v.createdAt.getTime();
            const fixed = v.updatedAt.getTime();
            return (fixed - detected) / (1000 * 60 * 60); // hours
        });

        const avgFixHours = fixTimes.reduce((a, b) => a + b, 0) / fixTimes.length;

        // Scoring: < 4h = 100, < 24h = 80, < 72h = 60, < 168h (1wk) = 40, else 20
        if (avgFixHours < 4) return 100;
        if (avgFixHours < 24) return 80;
        if (avgFixHours < 72) return 60;
        if (avgFixHours < 168) return 40;
        return 20;
    }

    /**
     * Risk Management Score (0-100)
     * Penalizes repeated vulnerability patterns (same type reappearing).
     */
    private async calcRiskManagementScore(userId: string): Promise<number> {
        const recentVulns = await prisma.vulnerability.findMany({
            where: {
                scan: { triggeredBy: userId },
                status: { in: ["OPEN", "CONFIRMED"] },
            },
            select: { vulnerabilityType: true },
        });

        if (recentVulns.length === 0) return 100; // Clean record

        // Count type frequency
        const typeCount: Record<string, number> = {};
        for (const v of recentVulns) {
            typeCount[v.vulnerabilityType] = (typeCount[v.vulnerabilityType] || 0) + 1;
        }

        // Repeated types (>1 occurrence) are risk signals
        const repeatedTypes = Object.values(typeCount).filter((c) => c > 1).length;
        const totalTypes = Object.keys(typeCount).length;

        // More repeated = lower score
        const repeatRatio = totalTypes > 0 ? repeatedTypes / totalTypes : 0;
        return this.clamp(100 - repeatRatio * 60 - recentVulns.length * 2);
    }

    /**
     * Consistency Score (0-100)
     * How regularly user pushes security-conscious commits.
     */
    private async calcConsistencyScore(userId: string): Promise<number> {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const recentScans = await prisma.codeScan.count({
            where: {
                triggeredBy: userId,
                status: "COMPLETED",
                completedAt: { gte: thirtyDaysAgo },
            },
        });

        // At least 1 scan per week = 100, 2/month = 60, 1/month = 40, 0 = 10
        if (recentScans >= 4) return 100;
        if (recentScans >= 2) return 60;
        if (recentScans >= 1) return 40;
        return 10;
    }

    private clamp(v: number): number {
        return Math.min(100, Math.max(0, v));
    }

    /** Get stored scores for a user */
    async getScores(userId: string): Promise<RepositoryScores | null> {
        const scores = await prisma.domainScore.findMany({
            where: { userId, domain: "REPOSITORY" }
        });

        if (scores.length === 0) return null;

        const result: Record<string, number> = {};
        for (const s of scores) {
            result[s.axis] = s.score;
        }

        return {
            secureCodingScore: result.secureCodingScore ?? 0,
            fixSpeedScore: result.fixSpeedScore ?? 0,
            riskManagementScore: result.riskManagementScore ?? 0,
            consistencyScore: result.consistencyScore ?? 0,
        };
    }
}

export interface RepositoryScores {
    secureCodingScore: number;
    fixSpeedScore: number;
    riskManagementScore: number;
    consistencyScore: number;
}

export const repositorySecurityDomain = new RepositorySecurityDomain();





