/**
 * GitHub Webhook Handler
 * Listens for push events and auto-triggers redeployment.
 *
 * Flow:
 *   1. GitHub pushes to a connected repo
 *   2. Webhook POST arrives at /api/infra/webhooks/github
 *   3. Validate HMAC SHA-256 signature
 *   4. Find matching DeployProject by repoUrl
 *   5. Trigger build via BuildService
 */

import { FastifyInstance } from "fastify";
import * as crypto from "crypto";
import { prisma } from "../../services/infra/prisma";
import { BuildService } from "../../services/infra/buildService";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

export default async function webhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/infra/webhooks/github
   * Handles GitHub push events for auto-deployment.
   */
  fastify.post("/webhooks/github", async (request, reply) => {
    const event = request.headers["x-github-event"] as string;
    const signature = request.headers["x-hub-signature-256"] as string;
    const body = JSON.stringify(request.body);

    // ── 1. Validate signature ───────────────────────────────
    if (WEBHOOK_SECRET) {
      const expectedSig =
        "sha256=" +
        crypto
          .createHmac("sha256", WEBHOOK_SECRET)
          .update(body)
          .digest("hex");

      if (signature !== expectedSig) {
        fastify.log.warn("❌ [Webhook] Invalid signature");
        return reply.status(401).send({ error: "Invalid signature" });
      }
    }

    // ── 2. Only handle push events ──────────────────────────
    if (event !== "push") {
      return { message: `Event '${event}' ignored`, handled: false };
    }

    const payload = request.body as any;
    const repoFullName = payload.repository?.full_name; // e.g. "somraj-dev/my-project"
    const branch = payload.ref?.replace("refs/heads/", ""); // e.g. "main"
    const commitHash = payload.after?.slice(0, 7);
    const commitMsg = payload.head_commit?.message || "Push event";
    const pusher = payload.pusher?.name || "github";

    fastify.log.info(
      `📦 [Webhook] Push: ${repoFullName}@${branch} by ${pusher}`,
    );

    // ── 3. Find matching project ────────────────────────────
    // Match by repo URL patterns (HTTPS and SSH)
    const projects = await prisma.deployProject.findMany({
      where: {
        OR: [
          { repoUrl: { contains: repoFullName || "" } },
          {
            repoOwner: payload.repository?.owner?.login,
            repoName: payload.repository?.name,
          },
        ],
      },
    });

    if (projects.length === 0) {
      fastify.log.info(
        `⚠️ [Webhook] No connected projects for repo: ${repoFullName}`,
      );
      return { message: "No matching projects", handled: false };
    }

    // ── 4. Trigger builds for matching projects ─────────────
    const results = [];

    for (const project of projects) {
      try {
        const result = await BuildService.triggerBuild(
          project.id,
          project.ownerId,
          {
            branch,
            commitHash,
            commitMsg: `${commitMsg} (auto-deploy)`,
            environment: branch === "main" ? "Production" : "Preview",
          },
        );

        results.push({
          projectId: project.id,
          projectName: project.name,
          deploymentId: result.deploymentId,
          status: "triggered",
        });

        fastify.log.info(
          `🚀 [Webhook] Triggered build for ${project.name}: ${result.deploymentId}`,
        );
      } catch (error: any) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message,
          status: "failed",
        });

        fastify.log.error(
          `❌ [Webhook] Failed to trigger build for ${project.name}: ${error.message}`,
        );
      }
    }

    return {
      message: `Processed push event for ${repoFullName}`,
      handled: true,
      builds: results,
    };
  });

  /**
   * POST /api/infra/webhooks/build-callback
   * Internal endpoint for build workers to report completion.
   */
  fastify.post("/webhooks/build-callback", async (request, reply) => {
    const { deploymentId, status, logs, artifactUrl, artifactSize, duration } =
      request.body as {
        deploymentId: string;
        status: "Ready" | "Error";
        logs?: string;
        artifactUrl?: string;
        artifactSize?: number;
        duration?: number;
      };

    // Validate callback secret
    const callbackSecret = request.headers["x-build-secret"] as string;
    const expectedSecret = process.env.BUILD_WORKER_SECRET || "";
    if (expectedSecret && callbackSecret !== expectedSecret) {
      return reply.status(401).send({ error: "Invalid build secret" });
    }

    await prisma.projectDeployment.update({
      where: { id: deploymentId },
      data: {
        status,
        buildLogs: logs,
        artifactUrl,
        artifactSize,
        duration,
        buildEndedAt: new Date(),
      },
    });

    // Update project status
    const deployment = await prisma.projectDeployment.findUnique({
      where: { id: deploymentId },
    });

    if (deployment) {
      await prisma.deployProject.update({
        where: { id: deployment.projectId },
        data: {
          buildStatus: status === "Ready" ? "READY" : "ERROR",
          lastBuildAt: new Date(),
          ...(status === "Ready"
            ? { activeDeployId: deploymentId }
            : {}),
        },
      });
    }

    return { message: "Callback processed", deploymentId, status };
  });
}
