import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { GitHubService } from "../../services/git/github";

export async function workflowRoutes(fastify: FastifyInstance) {
    // List workflows for a repository
    fastify.get(
        "/repositories/:id/workflows",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const { id } = request.params as { id: string };

            try {
                const workflows = await prisma.workflow.findMany({
                    where: { repoId: id },
                    orderBy: { updatedAt: "desc" },
                });

                return reply.send(workflows);
            } catch (error: any) {
                console.error("[Workflows] Failed to list workflows:", error);
                return reply.status(500).send({ error: "Failed to list workflows" });
            }
        }
    );

    // List workflow runs for a repository
    fastify.get(
        "/repositories/:id/workflow-runs",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const { id } = request.params as { id: string };

            try {
                const runs = await prisma.workflowRun.findMany({
                    where: { repoId: id },
                    orderBy: { createdAt: "desc" },
                    take: 50,
                });

                return reply.send(runs);
            } catch (error: any) {
                console.error("[Workflows] Failed to list workflow runs:", error);
                return reply.status(500).send({ error: "Failed to list workflow runs" });
            }
        }
    );

    // Dispatch a workflow
    fastify.post(
        "/repositories/:id/workflows/:workflowId/dispatch",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;
            const { id, workflowId } = request.params as { id: string, workflowId: string };
            const { ref } = request.body as { ref?: string };

            try {
                const repo = await prisma.repository.findUnique({
                    where: { id },
                    select: { name: true, htmlUrl: true }
                });

                if (!repo || !repo.htmlUrl) {
                    return reply.status(404).send({ error: "Repository not found or missing URL" });
                }

                const [owner, name] = repo.htmlUrl.split("/").slice(-2);

                await GitHubService.dispatchWorkflow(userId, owner, name, workflowId, ref || "main");

                return reply.send({ success: true, message: "Workflow dispatched" });
            } catch (error: any) {
                console.error("[Workflows] Failed to dispatch workflow:", error);
                return reply.status(500).send({ error: "Failed to dispatch workflow" });
            }
        }
    );
}
