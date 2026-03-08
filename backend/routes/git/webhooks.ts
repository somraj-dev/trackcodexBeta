import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { WebhookService } from "../../services/git/webhookService";
import { requireRepoPermission, RepoLevel } from "../middleware/repoAuth";

// Shared prisma instance

/**
 * Webhooks API: External Notification Management
 * Provides endpoints for configuring repository and organization-level webhooks.
 */
export async function webhookRoutes(fastify: FastifyInstance) {
  // Create Repo Webhook
  fastify.post(
    "/repositories/:id/webhooks",
    { preHandler: requireRepoPermission(RepoLevel.ADMIN) },
    async (request, reply) => {
      const { id: repoId } = request.params as { id: string };
      const body = request.body as {
        url: string;
        secret?: string;
        events: string[];
      };

      const hook = await WebhookService.createWebhook({
        url: body.url,
        secret: body.secret,
        repoId,
        events: body.events,
      });

      return reply.code(201).send(hook);
    },
  );

  // List Repo Webhooks
  fastify.get(
    "/repositories/:id/webhooks",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request) => {
      const { id: repoId } = request.params as { id: string };
      return await prisma.webhook.findMany({
        where: { repoId },
        include: { deliveries: { take: 5, orderBy: { createdAt: "desc" } } },
      });
    },
  );

  // Trigger Test Delivery (Baseline Ping)
  fastify.post("/webhooks/:id/ping", async (request) => {
    const { id } = request.params as { id: string };
    const hook = await prisma.webhook.findUnique({ where: { id } });
    if (!hook) throw new Error("Webhook not found");

    await WebhookService.dispatch(hook.repoId!, "ping", {
      zen: "Keep it logically awesome.",
      hook_id: hook.id,
    });

    return { message: "Ping dispatched" };
  });
}
