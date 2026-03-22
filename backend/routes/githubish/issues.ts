import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";

export const githubIssuesRoutes: FastifyPluginAsync = async (server) => {
    // GET /github/:id/issues — list issues for a repo
    server.get("/:id/issues", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.query as { status?: string };

        try {
            const issues = await prisma.issue.findMany({
                where: { 
                    repoId: id,
                    ...(status ? { status: status.toUpperCase() } : {})
                },
                include: { labels: true, author: { select: { username: true, name: true, avatar: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return issues;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // POST /github/:id/issues — create a new issue
    server.post("/:id/issues", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { title, body, labels, assignee_id } = request.body as { 
            title: string; body?: string; labels?: string[]; assignee_id?: string 
        };
        const user = (request as any).user;

        try {
            const lastIssue = await prisma.issue.findFirst({
                where: { repoId: id },
                orderBy: { number: 'desc' }
            });
            const nextNumber = lastIssue ? lastIssue.number + 1 : 1;

            const issue = await prisma.issue.create({
                data: {
                    repoId: id,
                    authorId: user.userId,
                    title,
                    body,
                    number: nextNumber,
                    status: "OPEN",
                }
            });
            return reply.code(201).send(issue);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // PATCH /github/:id/issues/:issueId — update an issue
    server.patch("/:id/issues/:issueId", { preHandler: requireAuth }, async (request, reply) => {
        const { issueId } = request.params as { id: string; issueId: string };
        const { status, body } = request.body as { status?: string; body?: string };

        try {
            const issue = await prisma.issue.update({
                where: { id: issueId },
                data: {
                    ...(status ? { status: status.toUpperCase() } : {}),
                    ...(body !== undefined ? { body } : {})
                }
            });
            return issue;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};
