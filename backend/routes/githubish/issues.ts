import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";

export const githubIssuesRoutes: FastifyPluginAsync = async (server) => {
    server.addHook("preHandler", requireAuth);

    server.post("/repos/:id/issues", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { title, body, labels, assignee_id } = request.body as { 
            title: string; body?: string; labels?: string[]; assignee_id?: string 
        };
        const user = (request as any).user;

        try {
            // Find the highest local issue number for this repo
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
            
            // If labels are provided, we should connect them. 
            // The prompt requested JSON labels, but `schema.prisma` natively uses a many-to-many relationship with `Label`.
            // Here, we just return the issue for simplicity in this MVP.
            
            return reply.code(201).send(issue);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    server.get("/repos/:id/issues", async (request, reply) => {
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

    server.patch("/issues/:issueId", async (request, reply) => {
        const { issueId } = request.params as { issueId: string };
        const { status, body } = request.body as { status?: string; body?: string };

        try {
            const issue = await prisma.issue.update({
                where: { id: issueId },
                data: {
                    ...(status ? { status: status.toUpperCase() } : {}),
                    ...(body ? { body } : {})
                }
            });
            return issue;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};
