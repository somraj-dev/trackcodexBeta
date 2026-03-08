/**
 * CSS API Routes
 * ================
 * REST endpoints for the Code Security System.
 *
 * POST /api/css/scan         — Trigger a security scan
 * GET  /api/css/scan/:id     — Get scan results
 * GET  /api/css/scans/:repoId — List scans for a repo
 * GET  /api/css/vulnerabilities/:repoId — Open vulnerabilities for a repo
 * POST /api/css/dismiss/:vulnId — Dismiss a vulnerability
 * POST /api/css/gate/:scanId  — Evaluate merge gate
 * GET  /api/css/queue/status  — Get scan queue status
 * GET  /api/css/shannon/health — Check Shannon adapter health
 */

import { FastifyInstance } from "fastify";
import { CSSService } from "../../services/css/CSSService";
import { scanQueue } from "../../services/css/ScanQueue";
import { governanceEngine } from "../../services/radar/GovernanceEngine";
import { shannonAdapter } from "../../services/shannon-adapter/ShannonAdapter";

export default async function cssRoutes(server: FastifyInstance) {
    /**
     * POST /api/css/scan
     * Trigger a new security scan.
     */
    server.post("/api/css/scan", async (request, reply) => {
        try {
            const body = request.body as {
                repositoryId: string;
                triggeredBy?: string;
                scanType?: "FULL" | "INCREMENTAL" | "PR_CHECK";
                commitSha?: string;
                branch?: string;
                files: Array<{ path: string; content: string; language: string }>;
                shannonEnabled?: boolean;
                async?: boolean;
            };

            if (!body.repositoryId || !body.files || body.files.length === 0) {
                return reply.code(400).send({
                    error: "repositoryId and files are required",
                });
            }

            const scanRequest = {
                repositoryId: body.repositoryId,
                triggeredBy: body.triggeredBy || "system",
                scanType: body.scanType,
                commitSha: body.commitSha,
                branch: body.branch,
                files: body.files,
                shannonEnabled: body.shannonEnabled,
            };

            // Async mode: enqueue and return immediately
            if (body.async) {
                scanQueue.enqueue(scanRequest).catch((err) => {
                    console.error(`[CSS Route] Async scan failed: ${err.message}`);
                });
                return reply.code(202).send({
                    message: "Scan queued",
                    queueStatus: scanQueue.getStatus(),
                });
            }

            // Sync mode: wait for result
            const result = await CSSService.scan(scanRequest);
            return reply.code(200).send(result);
        } catch (error: any) {
            console.error(`[CSS Route] Scan error: ${error.message}`);
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/css/scan/:id
     * Get scan results by ID.
     */
    server.get("/api/css/scan/:id", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const scan = await CSSService.getScan(id);

            if (!scan) {
                return reply.code(404).send({ error: "Scan not found" });
            }

            return reply.code(200).send(scan);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/css/scans/:repoId
     * List scans for a repository.
     */
    server.get("/api/css/scans/:repoId", async (request, reply) => {
        try {
            const { repoId } = request.params as { repoId: string };
            const scans = await CSSService.getScansForRepo(repoId);
            return reply.code(200).send(scans);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/css/vulnerabilities/:repoId
     * Get open vulnerabilities for a repository.
     */
    server.get("/api/css/vulnerabilities/:repoId", async (request, reply) => {
        try {
            const { repoId } = request.params as { repoId: string };
            const vulnerabilities = await CSSService.getOpenVulnerabilities(repoId);
            return reply.code(200).send(vulnerabilities);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * POST /api/css/dismiss/:vulnId
     * Dismiss a vulnerability.
     */
    server.post("/api/css/dismiss/:vulnId", async (request, reply) => {
        try {
            const { vulnId } = request.params as { vulnId: string };
            const body = request.body as { userId: string };

            if (!body.userId) {
                return reply.code(400).send({ error: "userId is required" });
            }

            const result = await CSSService.dismissVulnerability(vulnId, body.userId);
            return reply.code(200).send(result);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * POST /api/css/gate/:scanId
     * Evaluate the merge gate for a scan.
     */
    server.post("/api/css/gate/:scanId", async (request, reply) => {
        try {
            const { scanId } = request.params as { scanId: string };
            const body = request.body as {
                repositoryId: string;
                userId?: string;
            };

            if (!body.repositoryId) {
                return reply.code(400).send({ error: "repositoryId is required" });
            }

            const gateResult = await governanceEngine.evaluateMergeGate(
                body.repositoryId,
                scanId
            );

            // Push scores to Radar if userId provided
            if (body.userId) {
                await governanceEngine.pushToRadar(body.userId, scanId);
            }

            // Notify owner if blocked
            if (!gateResult.allowed) {
                await governanceEngine.notifyOwner(
                    body.repositoryId,
                    scanId,
                    "CRITICAL"
                );
            }

            return reply.code(200).send(gateResult);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    /**
     * GET /api/css/queue/status
     * Get the current scan queue status.
     */
    server.get("/api/css/queue/status", async (_request, reply) => {
        return reply.code(200).send(scanQueue.getStatus());
    });

    /**
     * GET /api/css/shannon/health
     * Check Shannon adapter health.
     */
    server.get("/api/css/shannon/health", async (_request, reply) => {
        const healthy = await shannonAdapter.healthCheck();
        return reply.code(200).send({
            enabled: shannonAdapter.isEnabled(),
            healthy,
        });
    });
}
