import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";

export const githubWebhooksRoutes: FastifyPluginAsync = async (server) => {
    server.addHook("preHandler", requireAuth);

    server.post("/repos/:id/webhooks", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { url, secret, events } = request.body as { url: string; secret?: string; events?: string[] };

        try {
            // Using existing 'Webhook' model since 'repo_webhooks' is redundant
            const webhook = await prisma.webhook.create({
                data: {
                    repoId: id,
                    url: url,
                    secret: secret || null,
                    events: events && events.length > 0 ? events : ["*"],
                    active: true,
                }
            });
            
            return reply.code(201).send(webhook);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};
