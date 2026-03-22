import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";

export const githubWebhooksRoutes: FastifyPluginAsync = async (server) => {
    // POST /github/:id/webhooks — create a webhook for a repo
    server.post("/:id/webhooks", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { url, secret, events } = request.body as { url: string; secret?: string; events?: string[] };

        try {
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

    // GET /github/:id/webhooks — list webhooks for a repo
    server.get("/:id/webhooks", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            const webhooks = await prisma.webhook.findMany({ where: { repoId: id } });
            return webhooks;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};
