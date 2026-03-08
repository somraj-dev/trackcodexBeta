/**
 * CSS Core Service — Code Security System Orchestrator
 * ======================================================
 * Main entry point for all CSS operations.
 *
 * Orchestrates:
 *  1. File collection from repository
 *  2. Static analysis (VulnerabilityDetector)
 *  3. Shannon exploit validation (via adapter)
 *  4. AHI AI hypothesis verification
 *  5. Confidence merging and scoring
 *  6. Persistence to PostgreSQL
 *  7. Radar/Governance integration
 */

import { prisma } from "../infra/prisma";
import { VulnerabilityDetector, VulnerabilityHypothesis } from "./VulnerabilityDetector";
import { AHIService, AHIInput } from "./AHIService";
import { shannonAdapter, ShannonCategory, ShannonFinding } from "../shannon-adapter/ShannonAdapter";

// Shared prisma instance

// --- Configuration ---

const CSS_CONFIG = {
    maxParallelScans: parseInt(process.env.CSS_MAX_PARALLEL_SCANS || "5", 10),
    shannonCategories: ["WEB_ROUTE", "AUTH_BYPASS", "INJECTION"] as ShannonCategory[],
    secureCodingThreshold: 70,
    criticalBlockThreshold: 1, // Block merge if >= 1 critical confirmed
};

// --- Types ---

export interface ScanRequest {
    repositoryId: string;
    triggeredBy: string;
    scanType?: "FULL" | "INCREMENTAL" | "PR_CHECK";
    commitSha?: string;
    branch?: string;
    files: Array<{ path: string; content: string; language: string }>;
    shannonEnabled?: boolean;
}

export interface ScanResult {
    scanId: string;
    status: string;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    secureCodingScore: number;
    riskScore: number;
    shouldBlockMerge: boolean;
    vulnerabilities: UnifiedVulnerability[];
}

export interface UnifiedVulnerability {
    id: string;
    repositoryId: string;
    filePath: string;
    lineNumber: number;
    vulnerabilityType: string;
    severity: string;
    confidenceScore: number;
    exploitReasoning: string;
    fixPatch: string;
    source: string;
    sink: string;
    validationSource: "CSS" | "SHANNON" | "BOTH";
}

// --- Active Scan Tracking ---

const activeScanCount = new Map<string, number>();

// --- Service Class ---

export class CSSService {
    /**
     * Execute a full security scan.
     */
    static async scan(request: ScanRequest): Promise<ScanResult> {
        const workspaceKey = request.repositoryId;

        // Enforce max parallel scans per workspace
        const currentCount = activeScanCount.get(workspaceKey) || 0;
        if (currentCount >= CSS_CONFIG.maxParallelScans) {
            throw new Error(
                `Maximum parallel scans (${CSS_CONFIG.maxParallelScans}) reached for workspace ${workspaceKey}`
            );
        }

        activeScanCount.set(workspaceKey, currentCount + 1);
        const startTime = Date.now();

        // Create scan record
        const scan = await prisma.codeScan.create({
            data: {
                repositoryId: request.repositoryId,
                triggeredBy: request.triggeredBy,
                scanType: request.scanType || "FULL",
                commitSha: request.commitSha,
                branch: request.branch,
                status: "IN_PROGRESS",
                shannonEnabled: request.shannonEnabled ?? shannonAdapter.isEnabled(),
                startedAt: new Date(),
            },
        });

        console.log(
            `🛡️ [CSS] Starting scan ${scan.id} for repo ${request.repositoryId} ` +
            `(${request.files.length} files, type: ${scan.scanType})`
        );

        try {
            // === Phase 1: Static Analysis ===
            const hypotheses = VulnerabilityDetector.detect(request.files);

            if (hypotheses.length === 0) {
                return await this.completeScan(scan.id, request.repositoryId, [], startTime);
            }

            // === Phase 2: Shannon Scan (Parallel, if enabled) ===
            let shannonFindings: ShannonFinding[] = [];
            if (scan.shannonEnabled) {
                const shannonResult = await shannonAdapter.scan({
                    repositoryId: request.repositoryId,
                    files: request.files.map((f) => ({
                        path: f.path,
                        content: f.content,
                        language: f.language,
                    })),
                    scanCategories: CSS_CONFIG.shannonCategories,
                });

                if (shannonResult) {
                    await prisma.codeScan.update({
                        where: { id: scan.id },
                        data: { shannonScanId: shannonResult.scanId },
                    });
                    shannonFindings = shannonResult.findings;
                }
            }

            // === Phase 3: AHI Validation ===
            const validatedVulnerabilities = await this.validateWithAHI(
                hypotheses,
                shannonFindings
            );

            // === Phase 4: Persist and Score ===
            return await this.completeScan(
                scan.id,
                request.repositoryId,
                validatedVulnerabilities,
                startTime
            );
        } catch (error: any) {
            console.error(`❌ [CSS] Scan ${scan.id} failed: ${error.message}`);

            await prisma.codeScan.update({
                where: { id: scan.id },
                data: {
                    status: "FAILED",
                    errorMessage: error.message,
                    completedAt: new Date(),
                    durationMs: Date.now() - startTime,
                },
            });

            throw error;
        } finally {
            const count = activeScanCount.get(workspaceKey) || 1;
            activeScanCount.set(workspaceKey, Math.max(0, count - 1));
        }
    }

    /**
     * Validate hypotheses with AHI, merging Shannon results.
     */
    private static async validateWithAHI(
        hypotheses: VulnerabilityHypothesis[],
        shannonFindings: ShannonFinding[]
    ): Promise<ValidatedVulnerability[]> {
        const validated: ValidatedVulnerability[] = [];

        for (const hypothesis of hypotheses) {
            // Find matching Shannon finding (by file + approximate line)
            const shannonMatch = shannonFindings.find(
                (sf) =>
                    sf.filePath === hypothesis.filePath &&
                    Math.abs(sf.lineNumber - hypothesis.lineNumber) <= 5
            );

            // Build AHI input
            const ahiInput: AHIInput = {
                codeSnippet: hypothesis.codeSnippet,
                dataFlowPath: hypothesis.dataFlowPath,
                ruleMetadata: {
                    vulnerabilityType: hypothesis.vulnerabilityType,
                    detectedPattern: hypothesis.detectedPattern,
                    source: hypothesis.source,
                    sink: hypothesis.sink,
                },
                shannonResult: shannonMatch
                    ? {
                        exploitable: shannonMatch.exploitable,
                        confidence: shannonMatch.confidence,
                        details: shannonMatch.details,
                    }
                    : null,
            };

            // AHI validation
            const ahiResult = await AHIService.validateHypothesis(ahiInput);

            // Determine confidence and validation source
            const { confidence, validationSource } = this.mergeConfidence(
                ahiResult.isExploitable,
                ahiResult.confidence,
                shannonMatch
            );

            // Discard if neither confirms
            if (!ahiResult.isExploitable && (!shannonMatch || !shannonMatch.exploitable)) {
                console.log(
                    `🗑️ [CSS] Discarding hypothesis at ${hypothesis.filePath}:${hypothesis.lineNumber} — ` +
                    `no validation confirmed`
                );
                continue;
            }

            validated.push({
                hypothesis,
                ahiResult,
                shannonMatch: shannonMatch || null,
                confidence,
                validationSource,
                finalSeverity: ahiResult.severity,
            });
        }

        return validated;
    }

    /**
     * Merge CSS + Shannon confidence.
     *
     * Both confirm → HIGH confidence
     * Only one confirms → MEDIUM confidence
     * None confirm → discard (handled upstream)
     */
    private static mergeConfidence(
        ahiExploitable: boolean,
        ahiConfidence: number,
        shannonMatch: ShannonFinding | undefined
    ): { confidence: number; validationSource: "CSS" | "SHANNON" | "BOTH" } {
        const shannonConfirmed = shannonMatch?.exploitable ?? false;
        const shannonConf = shannonMatch?.confidence ?? 0;

        if (ahiExploitable && shannonConfirmed) {
            return {
                confidence: Math.min(1, (ahiConfidence + shannonConf) / 2 + 0.15),
                validationSource: "BOTH",
            };
        } else if (ahiExploitable) {
            return {
                confidence: Math.min(1, ahiConfidence * 0.8),
                validationSource: "CSS",
            };
        } else if (shannonConfirmed) {
            return {
                confidence: Math.min(1, shannonConf * 0.7),
                validationSource: "SHANNON",
            };
        }

        return { confidence: 0, validationSource: "CSS" };
    }

    /**
     * Persist findings, compute scores, update scan record.
     */
    private static async completeScan(
        scanId: string,
        repositoryId: string,
        validated: ValidatedVulnerability[],
        startTime: number
    ): Promise<ScanResult> {
        // Persist vulnerabilities
        const savedVulnerabilities: UnifiedVulnerability[] = [];

        for (const v of validated) {
            const vuln = await prisma.vulnerability.create({
                data: {
                    scanId,
                    repositoryId,
                    filePath: v.hypothesis.filePath,
                    lineNumber: v.hypothesis.lineNumber,
                    endLine: v.hypothesis.endLine,
                    codeSnippet: v.hypothesis.codeSnippet,
                    vulnerabilityType: v.hypothesis.vulnerabilityType,
                    severity: v.finalSeverity,
                    confidenceScore: v.confidence,
                    source: v.hypothesis.source,
                    sink: v.hypothesis.sink,
                    dataFlowPath: v.hypothesis.dataFlowPath,
                    ahiExploitable: v.ahiResult.isExploitable,
                    ahiSeverity: v.ahiResult.severity,
                    ahiReasoning: v.ahiResult.reasoning,
                    ahiPatchCode: v.ahiResult.securePatchCode,
                    ahiConfidence: v.ahiResult.confidence,
                    shannonConfirmed: v.shannonMatch?.exploitable ?? null,
                    shannonDetails: v.shannonMatch?.details ?? null,
                    validationSource: v.validationSource,
                    status: "CONFIRMED",
                },
            });

            savedVulnerabilities.push({
                id: vuln.id,
                repositoryId: vuln.repositoryId,
                filePath: vuln.filePath,
                lineNumber: vuln.lineNumber,
                vulnerabilityType: vuln.vulnerabilityType,
                severity: vuln.severity,
                confidenceScore: vuln.confidenceScore,
                exploitReasoning: v.ahiResult.reasoning,
                fixPatch: v.ahiResult.securePatchCode,
                source: v.hypothesis.source,
                sink: v.hypothesis.sink,
                validationSource: vuln.validationSource as "CSS" | "SHANNON" | "BOTH",
            });
        }

        // Count by severity
        const criticalCount = savedVulnerabilities.filter((v) => v.severity === "CRITICAL").length;
        const highCount = savedVulnerabilities.filter((v) => v.severity === "HIGH").length;
        const mediumCount = savedVulnerabilities.filter((v) => v.severity === "MEDIUM").length;
        const lowCount = savedVulnerabilities.filter((v) => v.severity === "LOW").length;

        // Compute scores
        const secureCodingScore = this.calculateSecureCodingScore(savedVulnerabilities);
        const riskScore = this.calculateRiskScore(savedVulnerabilities);

        // Should merge be blocked?
        const shouldBlockMerge =
            criticalCount >= CSS_CONFIG.criticalBlockThreshold ||
            secureCodingScore < CSS_CONFIG.secureCodingThreshold;

        // Update scan record
        await prisma.codeScan.update({
            where: { id: scanId },
            data: {
                status: "COMPLETED",
                totalFindings: savedVulnerabilities.length,
                criticalCount,
                highCount,
                mediumCount,
                lowCount,
                secureCodingScore,
                riskScore,
                completedAt: new Date(),
                durationMs: Date.now() - startTime,
            },
        });

        console.log(
            `✅ [CSS] Scan ${scanId} completed in ${Date.now() - startTime}ms — ` +
            `${savedVulnerabilities.length} findings (C:${criticalCount} H:${highCount} ` +
            `M:${mediumCount} L:${lowCount}) — Score: ${secureCodingScore.toFixed(1)} ` +
            `— Block: ${shouldBlockMerge}`
        );

        return {
            scanId,
            status: "COMPLETED",
            totalFindings: savedVulnerabilities.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            secureCodingScore,
            riskScore,
            shouldBlockMerge,
            vulnerabilities: savedVulnerabilities,
        };
    }

    /**
     * Calculate secure coding score (0-100).
     * Higher is better. Deductions for each finding.
     */
    private static calculateSecureCodingScore(
        vulnerabilities: UnifiedVulnerability[]
    ): number {
        let score = 100;
        for (const v of vulnerabilities) {
            switch (v.severity) {
                case "CRITICAL":
                    score -= 25;
                    break;
                case "HIGH":
                    score -= 15;
                    break;
                case "MEDIUM":
                    score -= 8;
                    break;
                case "LOW":
                    score -= 3;
                    break;
            }
        }
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate risk score (0-100).
     * Higher means more risk.
     */
    private static calculateRiskScore(
        vulnerabilities: UnifiedVulnerability[]
    ): number {
        let risk = 0;
        for (const v of vulnerabilities) {
            const weight = v.confidenceScore;
            switch (v.severity) {
                case "CRITICAL":
                    risk += 30 * weight;
                    break;
                case "HIGH":
                    risk += 20 * weight;
                    break;
                case "MEDIUM":
                    risk += 10 * weight;
                    break;
                case "LOW":
                    risk += 5 * weight;
                    break;
            }
        }
        return Math.min(100, risk);
    }

    /**
     * Get scan results by ID.
     */
    static async getScan(scanId: string) {
        return prisma.codeScan.findUnique({
            where: { id: scanId },
            include: { vulnerabilities: true },
        });
    }

    /**
     * Get all scans for a repository.
     */
    static async getScansForRepo(repositoryId: string) {
        return prisma.codeScan.findMany({
            where: { repositoryId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }

    /**
     * Get open vulnerabilities for a repository.
     */
    static async getOpenVulnerabilities(repositoryId: string) {
        return prisma.vulnerability.findMany({
            where: {
                repositoryId,
                status: { in: ["OPEN", "CONFIRMED"] },
            },
            orderBy: [{ severity: "asc" }, { confidenceScore: "desc" }],
        });
    }

    /**
     * Dismiss a vulnerability.
     */
    static async dismissVulnerability(vulnId: string, userId: string) {
        return prisma.vulnerability.update({
            where: { id: vulnId },
            data: { status: "DISMISSED", dismissedBy: userId },
        });
    }
}

// --- Internal Types ---

interface ValidatedVulnerability {
    hypothesis: VulnerabilityHypothesis;
    ahiResult: {
        isExploitable: boolean;
        severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
        reasoning: string;
        securePatchCode: string;
        confidence: number;
    };
    shannonMatch: ShannonFinding | null;
    confidence: number;
    validationSource: "CSS" | "SHANNON" | "BOTH";
    finalSeverity: string;
}

export const cssService = new CSSService();





