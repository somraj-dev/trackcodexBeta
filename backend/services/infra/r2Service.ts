/**
 * Cloudflare Deployment Storage Service (Pure Cloudflare — No AWS/S3)
 * 
 * Communicates with the Cloudflare Worker Proxy to upload build artifacts.
 * Uses a simple Bearer token for authentication.
 * 
 * This approach eliminates the S3 protocol and AWS Signature V4 logic entirely.
 */

import * as fs from "fs";
import * as path from "path";

// ─── Config ────────────────────────────────────────────────────
// Format: https://trackcodex-site-proxy.xxxx.workers.dev
const DEPLOY_WORKER_URL = process.env.DEPLOY_WORKER_URL || "";
const DEPLOY_SECRET = process.env.DEPLOY_WORKER_SECRET || "";

export class R2Service {
  /**
   * Upload a single file to the Cloudflare Worker proxy.
   */
  static async uploadFile(
    projectSlug: string,
    deployId: string,
    filePath: string,
    relativeKey: string,
  ): Promise<{ key: string; size: number }> {
    if (!DEPLOY_WORKER_URL || !DEPLOY_SECRET) {
      throw new Error("Missing DEPLOY_WORKER_URL or DEPLOY_WORKER_SECRET in .env");
    }

    const body = fs.readFileSync(filePath);
    const deployUrl = `${DEPLOY_WORKER_URL}/_deploy/${projectSlug}/${deployId}/${relativeKey}`;

    const response = await fetch(deployUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${DEPLOY_SECRET}`,
        "Content-Type": "application/octet-stream", // Let the worker decide or pass it
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Deployment upload failed: ${response.status} ${errText}`);
    }

    return { key: relativeKey, size: body.length };
  }

  /**
   * Upload an entire directory (e.g., dist/) to the Cloudflare Worker proxy.
   */
  static async uploadDirectory(
    projectSlug: string,
    deployId: string,
    dirPath: string,
  ): Promise<{ totalFiles: number; totalSize: number }> {
    let totalFiles = 0;
    let totalSize = 0;

    const walkDir = async (currentPath: string, relativePrefix: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativeKey = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await walkDir(fullPath, relativeKey);
        } else {
          await R2Service.uploadFile(projectSlug, deployId, fullPath, relativeKey);
          const stats = fs.statSync(fullPath);
          totalFiles++;
          totalSize += stats.size;
        }
      }
    };

    await walkDir(dirPath, "");
    return { totalFiles, totalSize };
  }

  /**
   * Upload deployment metadata to the Cloudflare Worker proxy.
   */
  static async uploadMeta(
    projectSlug: string,
    deployId: string,
    meta: Record<string, unknown>,
  ): Promise<void> {
    const body = JSON.stringify(meta, null, 2);
    const deployUrl = `${DEPLOY_WORKER_URL}/_deploy/${projectSlug}/${deployId}/_meta.json`;

    const response = await fetch(deployUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${DEPLOY_SECRET}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Meta upload failed: ${errText}`);
    }
  }
}
