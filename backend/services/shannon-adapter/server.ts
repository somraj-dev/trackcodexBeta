/**
 * Shannon Adapter — Standalone Microservice
 * ===========================================
 * This runs as an isolated service (separate Docker container).
 * It exposes internal API endpoints for the CSS core to consume.
 *
 * DO NOT import or copy Shannon source code into this file.
 * This service wraps Shannon as an external tool.
 */

import Fastify from "fastify";
import { randomUUID } from "crypto";

const server = Fastify({ logger: true });

// --- In-Memory Scan Store (replace with Redis in production) ---

interface StoredScan {
    scanId: string;
    repositoryId: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    findings: ShannonFinding[];
    createdAt: Date;
    completedAt?: Date;
}

interface ShannonFinding {
    id: string;
    filePath: string;
    lineNumber: number;
    vulnerability: string;
    exploitable: boolean;
    confidence: number;
    details: string;
}

const scanStore = new Map<string, StoredScan>();

// --- Exploit Validation Patterns ---

interface ExploitPattern {
    category: string;
    patterns: RegExp[];
    exploitDescription: string;
    baseConfidence: number;
}

const EXPLOIT_PATTERNS: ExploitPattern[] = [
    // Web Route Vulnerabilities
    {
        category: "WEB_ROUTE",
        patterns: [
            /app\.(get|post|put|delete|patch)\s*\(\s*['"][^'"]*['"]\s*,\s*(?:async\s+)?\(?(?:req|request)/,
            /router\.(get|post|put|delete|patch)\s*\(/,
        ],
        exploitDescription: "Exposed web route without input validation",
        baseConfidence: 0.6,
    },
    // Auth Bypass
    {
        category: "AUTH_BYPASS",
        patterns: [
            /(?:isAdmin|isAuthenticated|isAuthorized)\s*=\s*(?:true|req\.)/,
            /jwt\.verify\s*\([\s\S]*?catch\s*\([\s\S]*?next\s*\(\s*\)/,
            /if\s*\(\s*!?\s*(?:token|auth|session)\s*\)\s*\{?\s*(?:return|next)/,
        ],
        exploitDescription: "Authentication mechanism may be bypassed",
        baseConfidence: 0.7,
    },
    // Injection
    {
        category: "INJECTION",
        patterns: [
            /(?:query|execute|raw)\s*\(\s*[`'"].*\$\{/,
            /exec\s*\(\s*[`'"].*\$\{/,
            /eval\s*\(/,
            /new\s+Function\s*\(/,
            /setTimeout\s*\(\s*(?:req|request)\./,
        ],
        exploitDescription: "User input flows into execution context",
        baseConfidence: 0.8,
    },
];

// --- Health Check ---

server.get("/health", async () => {
    return { status: "ok", service: "shannon-adapter", timestamp: new Date().toISOString() };
});

// --- POST /internal/shannon/scan ---

server.post("/internal/shannon/scan", async (request, reply) => {
    const body = request.body as {
        repositoryId: string;
        files: Array<{ path: string; content: string; language: string }>;
        scanCategories: string[];
    };

    if (!body.repositoryId || !body.files) {
        return reply.code(400).send({ error: "repositoryId and files are required" });
    }

    const scanId = randomUUID();
    const findings: ShannonFinding[] = [];

    // Analyze each file against exploit patterns
    for (const file of body.files) {
        const lines = file.content.split("\n");

        for (const pattern of EXPLOIT_PATTERNS) {
            // Only scan requested categories
            if (body.scanCategories && !body.scanCategories.includes(pattern.category)) {
                continue;
            }

            for (let i = 0; i < lines.length; i++) {
                for (const regex of pattern.patterns) {
                    if (regex.test(lines[i])) {
                        // Determine exploitability based on context analysis
                        const surrounding = lines
                            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 4))
                            .join("\n");

                        const hasValidation = /(?:sanitize|escape|validate|parameterized|prepared)/i.test(
                            surrounding
                        );
                        const hasErrorHandling = /(?:try|catch|throw|error)/i.test(surrounding);

                        const exploitable = !hasValidation;
                        const confidence =
                            pattern.baseConfidence *
                            (hasValidation ? 0.3 : 1.0) *
                            (hasErrorHandling ? 0.8 : 1.0);

                        findings.push({
                            id: randomUUID(),
                            filePath: file.path,
                            lineNumber: i + 1,
                            vulnerability: pattern.exploitDescription,
                            exploitable,
                            confidence: Math.min(1, confidence),
                            details: `[Shannon] Pattern matched in ${pattern.category}: ${lines[i].trim().substring(0, 120)}`,
                        });

                        break; // One finding per pattern per line
                    }
                }
            }
        }
    }

    const scan: StoredScan = {
        scanId,
        repositoryId: body.repositoryId,
        status: "COMPLETED",
        findings,
        createdAt: new Date(),
        completedAt: new Date(),
    };

    scanStore.set(scanId, scan);

    // Clean up old scans (keep last 100)
    if (scanStore.size > 100) {
        const oldest = Array.from(scanStore.keys()).slice(0, scanStore.size - 100);
        for (const key of oldest) {
            scanStore.delete(key);
        }
    }

    server.log.info(
        `Shannon scan ${scanId} completed: ${findings.length} findings for repo ${body.repositoryId}`
    );

    return reply.code(200).send({
        scanId,
        status: "COMPLETED",
        findings,
    });
});

// --- GET /internal/shannon/report/:id ---

server.get("/internal/shannon/report/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const scan = scanStore.get(id);

    if (!scan) {
        return reply.code(404).send({ error: "Scan not found" });
    }

    return reply.code(200).send({
        scanId: scan.scanId,
        status: scan.status,
        findings: scan.findings,
    });
});

// --- Start Server ---

const PORT = parseInt(process.env.SHANNON_PORT || "4100", 10);
const HOST = process.env.SHANNON_HOST || "0.0.0.0";

async function start() {
    try {
        await server.listen({ port: PORT, host: HOST });
        console.log(`🔬 Shannon Adapter listening on ${HOST}:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();





