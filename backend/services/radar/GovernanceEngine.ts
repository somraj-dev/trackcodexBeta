/**
 * Governance Engine — Layer 3
 *
 * Runs rule evaluation after every radar recalculation.
 * Rules stored in GovernanceRule table — fully configurable.
 *
 * Default rules:
 *   Secure Engineering < 60   → Block merge permission
 *   Applied Security < 50     → Marketplace jobs require manual approval
 *   Professional Reliability < 55 → Reduce ranking visibility
 *   Security Leadership > 85  → Grant advanced review privileges
 */
import { prisma } from "../infra/prisma";
import { radarEventBus, RadarAxis, RADAR_AXES } from "./RadarService";

// Shared prisma instance

// ─── Rule Actions ────────────────────────────────────────────────
export type GovernanceAction =
    | "BLOCK_MERGE"
    | "REQUIRE_APPROVAL"
    | "REDUCE_RANKING"
    | "GRANT_PRIVILEGES";

// ─── Governance Engine ───────────────────────────────────────────
export class GovernanceEngine {
    constructor() {
        // Auto-evaluate after every radar recalculation
        radarEventBus.on(
            "radar:recalculated",
            async (userId: string, axes: Record<RadarAxis, number>) => {
                try {
                    await this.evaluateRules(userId, axes);
                } catch (err) {
                    console.error(`❌ [Governance] Rule evaluation failed for ${userId}:`, err);
                }
            }
        );
    }

    /**
     * Evaluate all active governance rules against a user's radar axes.
     * Returns the list of triggered actions.
     */
    async evaluateRules(
        userId: string,
        axes: Record<RadarAxis, number>
    ): Promise<GovernanceEvaluation[]> {
        const rules = await prisma.governanceRule.findMany({
            where: { active: true },
        });

        const evaluations: GovernanceEvaluation[] = [];

        for (const rule of rules) {
            const axisScore = axes[rule.axisName as RadarAxis];
            if (axisScore === undefined) continue;

            const triggered = this.evaluateCondition(axisScore, rule.operator, rule.threshold);

            evaluations.push({
                ruleId: rule.id,
                axisName: rule.axisName,
                axisScore,
                operator: rule.operator,
                threshold: rule.threshold,
                action: rule.action as GovernanceAction,
                triggered,
                description: rule.description || undefined,
            });
        }

        const triggeredActions = evaluations.filter((e) => e.triggered);
        if (triggeredActions.length > 0) {
            console.warn(
                `⚖️ [Governance] ${triggeredActions.length} rules triggered for user ${userId}:`,
                triggeredActions.map((a) => `${a.axisName} ${a.operator} ${a.threshold} → ${a.action}`).join(", ")
            );
        }

        return evaluations;
    }

    /**
     * Get current permissions for a user based on governance rules.
     */
    async getPermissions(userId: string): Promise<UserPermissions> {
        // Pull current radar state
        const radarStates = await prisma.userRadarState.findMany({
            where: { userId },
        });

        const axes: Record<string, number> = {};
        for (const s of radarStates) {
            axes[s.axisName] = s.axisScore;
        }

        // Evaluate against active rules
        const rules = await prisma.governanceRule.findMany({
            where: { active: true },
        });

        const permissions: UserPermissions = {
            canMerge: true,
            requiresMarketplaceApproval: false,
            rankingVisible: true,
            hasAdvancedReviewPrivileges: false,
            triggeredRules: [],
        };

        for (const rule of rules) {
            const score = axes[rule.axisName] ?? 0;
            const triggered = this.evaluateCondition(score, rule.operator, rule.threshold);

            if (triggered) {
                permissions.triggeredRules.push({
                    axis: rule.axisName,
                    action: rule.action,
                    description: rule.description || "",
                });

                switch (rule.action) {
                    case "BLOCK_MERGE":
                        permissions.canMerge = false;
                        break;
                    case "REQUIRE_APPROVAL":
                        permissions.requiresMarketplaceApproval = true;
                        break;
                    case "REDUCE_RANKING":
                        permissions.rankingVisible = false;
                        break;
                    case "GRANT_PRIVILEGES":
                        permissions.hasAdvancedReviewPrivileges = true;
                        break;
                }
            }
        }

        return permissions;
    }

    /**
     * Evaluate CSS merge gate (preserved from previous implementation).
     */
    async evaluateMergeGate(
        repositoryId: string,
        scanId: string
    ): Promise<MergeGateResult> {
        const scan = await prisma.codeScan.findUnique({
            where: { id: scanId },
            include: {
                vulnerabilities: {
                    where: { status: { in: ["OPEN", "CONFIRMED"] } },
                },
            },
        });

        if (!scan) {
            return { allowed: true, reason: "No scan found — allowing merge", requiresReview: false };
        }

        if (scan.status !== "COMPLETED") {
            return {
                allowed: false,
                reason: `Scan ${scanId} is still ${scan.status}. Wait for completion.`,
                requiresReview: false,
            };
        }

        if (scan.criticalCount > 0) {
            return {
                allowed: false,
                reason: `${scan.criticalCount} critical vulnerability(ies) detected. Fix before merging.`,
                requiresReview: true,
                findings: scan.vulnerabilities.filter((v) => v.severity === "CRITICAL"),
            };
        }

        const SECURE_THRESHOLD = 70;
        if (scan.secureCodingScore !== null && scan.secureCodingScore < SECURE_THRESHOLD) {
            return {
                allowed: false,
                reason: `Secure coding score (${scan.secureCodingScore.toFixed(1)}) below threshold (${SECURE_THRESHOLD}).`,
                requiresReview: true,
                findings: scan.vulnerabilities,
            };
        }

        if (scan.highCount > 0) {
            return {
                allowed: true,
                reason: `${scan.highCount} HIGH severity findings. Review recommended.`,
                requiresReview: true,
                findings: scan.vulnerabilities.filter((v) => v.severity === "HIGH"),
            };
        }

        return { allowed: true, reason: "All security checks passed.", requiresReview: false };
    }

    /**
     * Seed default governance rules into the database.
     */
    async seedDefaultRules(): Promise<void> {
        const defaults = [
            {
                axisName: "SECURE_ENGINEERING",
                operator: "LT",
                threshold: 60,
                action: "BLOCK_MERGE",
                description: "Block merge permission when Secure Engineering score is below 60",
            },
            {
                axisName: "APPLIED_SECURITY",
                operator: "LT",
                threshold: 50,
                action: "REQUIRE_APPROVAL",
                description: "Marketplace jobs require manual approval when Applied Security is below 50",
            },
            {
                axisName: "PROFESSIONAL_RELIABILITY",
                operator: "LT",
                threshold: 55,
                action: "REDUCE_RANKING",
                description: "Reduce ranking visibility when Professional Reliability is below 55",
            },
            {
                axisName: "SECURITY_LEADERSHIP",
                operator: "GT",
                threshold: 85,
                action: "GRANT_PRIVILEGES",
                description: "Grant advanced review privileges when Security Leadership exceeds 85",
            },
        ];

        for (const rule of defaults) {
            const existing = await prisma.governanceRule.findFirst({
                where: { axisName: rule.axisName, action: rule.action },
            });
            if (!existing) {
                await prisma.governanceRule.create({ data: rule });
            }
        }

        console.warn(`⚖️ [Governance] Default rules seeded`);
    }

    /**
     * List all governance rules.
     */
    async listRules() {
        return prisma.governanceRule.findMany({
            orderBy: { axisName: "asc" },
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────
    private evaluateCondition(score: number, operator: string, threshold: number): boolean {
        switch (operator) {
            case "LT": return score < threshold;
            case "GT": return score > threshold;
            case "LTE": return score <= threshold;
            case "GTE": return score >= threshold;
            default: return false;
        }
    }
}

// ─── Types ───────────────────────────────────────────────────────

export interface GovernanceEvaluation {
    ruleId: string;
    axisName: string;
    axisScore: number;
    operator: string;
    threshold: number;
    action: GovernanceAction;
    triggered: boolean;
    description?: string;
}

export interface UserPermissions {
    canMerge: boolean;
    requiresMarketplaceApproval: boolean;
    rankingVisible: boolean;
    hasAdvancedReviewPrivileges: boolean;
    triggeredRules: Array<{ axis: string; action: string; description: string }>;
}

export interface MergeGateResult {
    allowed: boolean;
    reason: string;
    requiresReview: boolean;
    findings?: unknown[];
}

export const governanceEngine = new GovernanceEngine();





