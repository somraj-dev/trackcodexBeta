/**
 * Gitea Webhook Receiver Routes
 * Handles incoming webhook events from Gitea (push, issues, PRs, etc.)
 */

import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { RealtimeService } from "../services/realtime";

const prisma = new PrismaClient();

export async function giteaWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/gitea/push
   * Called by Gitea whenever someone does `git push`.
   * Updates repository metadata and notifies connected frontends.
   */
  fastify.post("/webhooks/gitea/push", async (request, reply) => {
    const payload = request.body as any;

    try {
      const repoName = payload?.repository?.name;
      const repoFullName = payload?.repository?.full_name;
      const pusherName = payload?.pusher?.login || payload?.pusher?.username;
      const commitCount = payload?.commits?.length || 0;
      const ref = payload?.ref || "";
      const branch = ref.replace("refs/heads/", "");

      request.log.info(
        `[Gitea Webhook] Push received: ${repoFullName} (${commitCount} commits to ${branch}) by ${pusherName}`,
      );

      // Find the TrackCodex repository by Gitea repo name
      if (repoName) {
        const repo = await prisma.repository.findFirst({
          where: {
            name: repoName,
            giteaId: payload?.repository?.id || undefined,
          },
        });

        if (repo) {
          // Update repository's last activity timestamp
          await prisma.repository.update({
            where: { id: repo.id },
            data: {
              updatedAt: new Date(),
              lastSyncAt: new Date(),
            },
          });

          // Notify connected frontends via WebSocket
          try {
            RealtimeService.broadcast("repo:push", {
              repoId: repo.id,
              repoName,
              branch,
              commitCount,
              pusher: pusherName,
              timestamp: new Date().toISOString(),
            });
          } catch {
            // RealtimeService may not be initialized yet
          }

          request.log.info(
            `[Gitea Webhook] Repository "${repoName}" updated in DB`,
          );
        } else {
          request.log.warn(
            `[Gitea Webhook] Repository "${repoName}" not found in TrackCodex DB`,
          );
        }
      }

      return { received: true };
    } catch (error: any) {
      request.log.error(`[Gitea Webhook] Error processing push: ${error.message}`);
      return reply.code(500).send({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /webhooks/gitea/events
   * Generic webhook handler for other Gitea events (issues, PRs, etc.)
   * Can be expanded as needed.
   */
  fastify.post("/webhooks/gitea/events", async (request, reply) => {
    const event = request.headers["x-gitea-event"] as string;
    const payload = request.body as any;

    request.log.info(
      `[Gitea Webhook] Event received: ${event} for ${payload?.repository?.full_name || "unknown"}`,
    );

    // Future: Handle issue, PR, release events etc.
    // switch (event) {
    //   case "issues":
    //   case "pull_request":
    //   case "release":
    // }

    return { received: true, event };
  });
}
