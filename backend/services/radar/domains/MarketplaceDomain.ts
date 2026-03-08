/**
 * Marketplace Domain — Layer 1
 *
 * Inputs:  Job success rate, delivery time adherence, client rating,
 *          security compliance, disputes
 * Outputs: professional_reliability_score, delivery_discipline_score, applied_security_score
 *
 * All scores normalized 0-100.
 */
import { prisma } from "../../prisma";

// Shared prisma instance

export class MarketplaceDomain {
    /**
     * Recalculate all marketplace scores for a user.
     * Called after job completion, review submission, or dispute resolution.
     */
    async recalculate(userId: string): Promise<MarketplaceScores> {
        const scores = {
            professionalReliabilityScore: await this.calcReliabilityScore(userId),
            deliveryDisciplineScore: await this.calcDeliveryScore(userId),
            appliedSecurityScore: await this.calcAppliedSecurityScore(userId),
        };

        // Persist each axis to the unified DomainScore table
        const upserts = Object.entries(scores).map(([axis, score]) =>
            prisma.domainScore.upsert({
                where: { userId_domain_axis: { userId, domain: "MARKETPLACE", axis } },
                create: { userId, domain: "MARKETPLACE", axis, score },
                update: { score },
            })
        );
        await Promise.all(upserts);

        return scores;
    }

    /**
     * Professional Reliability Score (0-100)
     * Combines job success rate + client rating.
     */
    private async calcReliabilityScore(userId: string): Promise<number> {
        // Get completed and abandoned jobs
        const [completed, total, reviews] = await Promise.all([
            prisma.jobApplication.count({
                where: { applicantId: userId, status: "COMPLETED" },
            }),
            prisma.jobApplication.count({
                where: { applicantId: userId, status: { in: ["COMPLETED", "ABANDONED", "REJECTED"] } },
            }),
            prisma.jobReview.findMany({
                where: { freelancer: { userId } },
                select: { rating: true },
            }),
        ]);

        // Job success rate (0-100)
        const successRate = total > 0 ? (completed / total) * 100 : 50;

        // Average client rating (1-5 → 0-100)
        const avgRating =
            reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 20
                : 50;

        // Weighted blend: 60% success rate, 40% rating
        return this.clamp(0.6 * successRate + 0.4 * avgRating);
    }

    /**
     * Delivery Discipline Score (0-100)
     * On-time delivery percentage.
     */
    private async calcDeliveryScore(userId: string): Promise<number> {
        const applications = await prisma.jobApplication.findMany({
            where: { applicantId: userId, status: "COMPLETED" },
            include: { job: true },
        });

        if (applications.length === 0) return 50;

        let onTime = 0;
        for (const app of applications) {
            // Check if completed before job deadline (if deadline ever added)
            // For now, assume on-time as deadline field is missing in schema
            const jobWithDeadline = app.job as any;
            if (jobWithDeadline.deadline) {
                const deadline = new Date(jobWithDeadline.deadline).getTime();
                const completed = app.updatedAt.getTime();
                if (completed <= deadline) onTime++;
            } else {
                onTime++;
            }
        }

        return this.clamp((onTime / applications.length) * 100);
    }

    /**
     * Applied Security Score (0-100)
     * Security compliance on delivered jobs — pulls from repo security domain.
     */
    private async calcAppliedSecurityScore(userId: string): Promise<number> {
        // Check user's repository security scores from the unified table
        const scores = await prisma.domainScore.findMany({
            where: { userId, domain: "REPOSITORY" }
        });

        if (scores.length === 0) return 50; // Neutral if no repo data

        const r: Record<string, number> = {};
        for (const s of scores) {
            r[s.axis] = s.score;
        }

        // Blend secure coding (70%) + risk management (30%)
        return this.clamp(
            0.7 * (r.secureCodingScore ?? 0) +
            0.3 * (r.riskManagementScore ?? 0)
        );
    }

    private clamp(v: number): number {
        return Math.min(100, Math.max(0, v));
    }

    async getScores(userId: string): Promise<MarketplaceScores | null> {
        const scores = await prisma.domainScore.findMany({
            where: { userId, domain: "MARKETPLACE" }
        });

        if (scores.length === 0) return null;

        const result: Record<string, number> = {};
        for (const s of scores) {
            result[s.axis] = s.score;
        }

        return {
            professionalReliabilityScore: result.professionalReliabilityScore ?? 0,
            deliveryDisciplineScore: result.deliveryDisciplineScore ?? 0,
            appliedSecurityScore: result.appliedSecurityScore ?? 0,
        };
    }
}

export interface MarketplaceScores {
    professionalReliabilityScore: number;
    deliveryDisciplineScore: number;
    appliedSecurityScore: number;
}

export const marketplaceDomain = new MarketplaceDomain();





