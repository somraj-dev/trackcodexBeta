/**
 * Shannon Adapter Service
 * ========================
 * Isolated adapter that wraps the Shannon exploit validation concept.
 * All Shannon interactions MUST go through this adapter.
 * The core CSS works even if Shannon is disabled.
 *
 * This is TrackCodex original IP — inspired by Shannon's architecture
 * but NOT copying Shannon source code.
 */

import axios, { AxiosInstance } from "axios";

// --- Types ---

export interface ShannonScanRequest {
    repositoryId: string;
    files: ShannonFileInput[];
    scanCategories: ShannonCategory[];
}

export interface ShannonFileInput {
    path: string;
    content: string;
    language: string;
}

export type ShannonCategory = "WEB_ROUTE" | "AUTH_BYPASS" | "INJECTION";

export interface ShannonScanResult {
    scanId: string;
    status: "PENDING" | "COMPLETED" | "FAILED";
    findings: ShannonFinding[];
}

export interface ShannonFinding {
    id: string;
    filePath: string;
    lineNumber: number;
    vulnerability: string;
    exploitable: boolean;
    confidence: number;
    details: string;
}

// --- Configuration ---

const SHANNON_CONFIG = {
    baseUrl: process.env.SHANNON_ADAPTER_URL || "https://api.trackcodex.com",
    timeout: parseInt(process.env.SHANNON_TIMEOUT_MS || "30000", 10),
    enabled: process.env.SHANNON_ENABLED !== "false",
    maxRetries: 2,
};

// --- Adapter Class ---

export class ShannonAdapter {
    private client: AxiosInstance;
    private enabled: boolean;

    constructor() {
        this.enabled = SHANNON_CONFIG.enabled;
        this.client = axios.create({
            baseURL: SHANNON_CONFIG.baseUrl,
            timeout: SHANNON_CONFIG.timeout,
            headers: {
                "Content-Type": "application/json",
                "X-Service": "trackcodex-css",
            },
        });
    }

    /**
     * Check if Shannon adapter is available and enabled.
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Initiate a Shannon scan.
     * Only scans web routes, auth bypass, and injection-style risks.
     */
    async scan(request: ShannonScanRequest): Promise<ShannonScanResult | null> {
        if (!this.enabled) {
            console.log("🔇 [ShannonAdapter] Shannon is disabled, skipping scan.");
            return null;
        }

        try {
            console.log(
                `🔍 [ShannonAdapter] Initiating scan for repo ${request.repositoryId} ` +
                `with ${request.files.length} files across categories: ${request.scanCategories.join(", ")}`
            );

            const response = await this.client.post<ShannonScanResult>(
                "/internal/shannon/scan",
                request
            );

            console.log(
                `✅ [ShannonAdapter] Scan initiated: ${response.data.scanId}`
            );
            return response.data;
        } catch (error: any) {
            console.error(
                `❌ [ShannonAdapter] Scan failed: ${error.message}`
            );
            // Shannon failure must NOT block CSS — graceful degradation
            return null;
        }
    }

    /**
     * Retrieve a Shannon scan report by ID.
     */
    async getReport(scanId: string): Promise<ShannonScanResult | null> {
        if (!this.enabled) return null;

        try {
            const response = await this.client.get<ShannonScanResult>(
                `/internal/shannon/report/${scanId}`
            );
            return response.data;
        } catch (error: any) {
            console.error(
                `❌ [ShannonAdapter] Failed to fetch report ${scanId}: ${error.message}`
            );
            return null;
        }
    }

    /**
     * Health check for the Shannon service.
     */
    async healthCheck(): Promise<boolean> {
        if (!this.enabled) return false;

        try {
            const response = await this.client.get("/health", { timeout: 5000 });
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

// Singleton export
export const shannonAdapter = new ShannonAdapter();





