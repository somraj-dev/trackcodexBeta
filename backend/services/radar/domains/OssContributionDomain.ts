/**
 * Open Source Contribution Domain — Layer 1
 *
 * Inputs:  PRs merged, security patches, maintainer approvals, code reviews accepted
 * Outputs: engineering_depth_score, security_leadership_score, oss_impact_score
 *
 * All scores normalized 0-100.
 */
import { prisma } from "../../prisma";

// Shared prisma instance

export class OssContributionDomain {
    /**
     * Recalculate all OSS contribution scores for a user.
     * Called after PR merge, review accepted, or periodic recalc.
     */
    async recalculate(userId: string): Promise<OssScores> {
        const scores = {
            engineeringDepthScore: await this.calcEngineeringDepth(userId),
            securityLeadershipScore: await this.calcSecurityLeadership(userId),
            ossImpactScore: await this.calcOssImpact(userId),
        };

        // Persist each axis to the unified DomainScore table
        const upserts = Object.entries(scores).map(([axis, score]) =>
            prisma.domainScore.upsert({
                where: { userId_domain_axis: { userId, domain: "OSS", axis } },
                create: { userId, domain: "OSS", axis, score },
                update: { score },
            })
        );
        await Promise.all(upserts);

        return scores;
    }

    /**
     * Engineering Depth Score (0-100)
     * PRs merged + code reviews accepted = deep engineering engagement.
     */
    private async calcEngineeringDepth(userId: string): Promise<number> {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const [prsMerged, reviewsGiven] = await Promise.all([
            prisma.pullRequest.count({
                where: {
                    authorId: userId,
                    status: "MERGED",
                    mergedAt: { gte: ninetyDaysAgo },
                },
            }),
            prisma.comment.count({
                where: {
                    authorId: userId,
                    pullRequestId: { not: null },
                    createdAt: { gte: ninetyDaysAgo },
                },
            }),
        ]);

        // Benchmarks: 20 PRs + 40 reviews in 90 days = 100
        const prScore = Math.min((prsMerged / 20) * 60, 60);
        const reviewScore = Math.min((reviewsGiven / 40) * 40, 40);
        return this.clamp(prScore + reviewScore);
    }

    /**
     * Security Leadership Score (0-100)
     * Security patches contributed + maintainer trust.
     */
    private async calcSecurityLeadership(userId: string): Promise<number> {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        // Security-related PRs (titles/labels containing security keywords)
        const securityPRs = await prisma.pullRequest.count({
            where: {
                authorId: userId,
                status: "MERGED",
                mergedAt: { gte: ninetyDaysAgo },
                OR: [
                    { title: { contains: "security", mode: "insensitive" } },
                    { title: { contains: "vulnerability", mode: "insensitive" } },
                    { title: { contains: "CVE", mode: "insensitive" } },
                    { title: { contains: "fix", mode: "insensitive" } },
                    { title: { contains: "patch", mode: "insensitive" } },
                ],
            },
        });

        // Fixed vulnerabilities
        const vulnsFixed = await prisma.vulnerability.count({
            where: {
                scan: { triggeredBy: userId },
                status: "FIXED",
            },
        });

        // Benchmark: 5 security PRs + 10 vuln fixes = 100
        const prScore = Math.min((securityPRs / 5) * 50, 50);
        const fixScore = Math.min((vulnsFixed / 10) * 50, 50);
        return this.clamp(prScore + fixScore);
    }

    /**
     * OSS Impact Score (0-100)
     * Community reach: stars on user's repos, forks, adoption.
     */
    private async calcOssImpact(userId: string): Promise<number> {
        const repos = await prisma.repository.findMany({
            where: { ownerId: userId, visibility: "PUBLIC" },
            select: { stars: true, forksCount: true },
        });

        if (repos.length === 0) return 10; // Baseline for no public repos

        const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
        const totalForks = repos.reduce((sum, r) => sum + (r.forksCount || 0), 0);

        // Benchmark: 100 stars + 30 forks = 100
        const starScore = Math.min((totalStars / 100) * 60, 60);
        const forkScore = Math.min((totalForks / 30) * 40, 40);
        return this.clamp(starScore + forkScore);
    }

    private clamp(v: number): number {
        return Math.min(100, Math.max(0, v));
    }

    async getScores(userId: string): Promise<OssScores | null> {
        const scores = await prisma.domainScore.findMany({
            where: { userId, domain: "OSS" }
        });

        if (scores.length === 0) return null;

        const result: Record<string, number> = {};
        for (const s of scores) {
            result[s.axis] = s.score;
        }

        return {
            engineeringDepthScore: result.engineeringDepthScore ?? 0,
            securityLeadershipScore: result.securityLeadershipScore ?? 0,
            ossImpactScore: result.ossImpactScore ?? 0,
        };
    }
}

export interface OssScores {
    engineeringDepthScore: number;
    securityLeadershipScore: number;
    ossImpactScore: number;
}

export const ossContributionDomain = new OssContributionDomain();





