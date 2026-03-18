import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { GitStorageService } from "../../services/git/gitStorageService";
import path from "path";

export const githubPullRequestsRoutes: FastifyPluginAsync = async (server) => {
    server.addHook("preHandler", requireAuth);

    server.post("/repos/:id/pull-requests", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { title, body, source_branch, target_branch } = request.body as { 
            title: string; body?: string; source_branch: string; target_branch: string;
        };
        const user = (request as any).user;

        try {
            // Find highest PR number
            const lastPr = await prisma.pullRequest.findFirst({
                where: { repoId: id },
                orderBy: { number: 'desc' }
            });
            const nextNumber = lastPr ? lastPr.number + 1 : 1;

            const pullRequest = await prisma.pullRequest.create({
                data: {
                    repoId: id,
                    authorId: user.userId,
                    title,
                    body,
                    base: target_branch,
                    head: source_branch,
                    number: nextNumber,
                    status: "OPEN",
                }
            });

            // Trigger webhooks asynchronously
            triggerWebhooks(id, "pull_request_opened", pullRequest).catch(console.error);

            return reply.code(201).send(pullRequest);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    server.get("/pull-requests/:prId", async (request, reply) => {
        const { prId } = request.params as { prId: string };
        
        try {
            const pr = await prisma.pullRequest.findUnique({ where: { id: prId } });
            if (!pr) return reply.code(404).send({ error: "Not found" });
            
            const repo = await prisma.repository.findUnique({ where: { id: pr.repoId } });
            if (!repo) return reply.code(404).send({ error: "Repo not found" });

            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            const repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            
            const diffStr = await GitStorageService.compareBranches(repoPath, pr.base, pr.head);
            
            return {
                ...pr,
                diff: diffStr
            };
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    server.post("/pull-requests/:prId/merge", async (request, reply) => {
        const { prId } = request.params as { prId: string };
        const user = (request as any).user;

        try {
            const pr = await prisma.pullRequest.findUnique({ where: { id: prId } });
            if (!pr || pr.status !== "OPEN") return reply.code(400).send({ error: "Invalid PR or not OPEN" });
            
            const repo = await prisma.repository.findUnique({ where: { id: pr.repoId } });
            if (!repo) return reply.code(404).send({ error: "Repo not found" });

            const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });

            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            const repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            
            const mergeResult = await GitStorageService.mergePullRequest(
                repoPath, 
                pr.head, 
                pr.base, 
                dbUser?.name || dbUser?.username || "TrackCodex User",
                dbUser?.email || "noreply@trackcodex.com"
            );
            
            if (!mergeResult.success) {
                return reply.code(409).send({ error: "Merge conflict", conflicts: mergeResult.conflicts });
            }
            
            const updatedPr = await prisma.pullRequest.update({
                where: { id: prId },
                data: {
                    status: "MERGED",
                    mergedAt: new Date(),
                    mergedBy: user.userId
                }
            });

            triggerWebhooks(pr.repoId, "pull_request_merged", updatedPr).catch(console.error);

            return { success: true, pr: updatedPr };
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};

async function triggerWebhooks(repoId: string, event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({ where: { repoId, active: true } });
    const fetch = require('node-fetch');
    for (const hook of webhooks) {
        if (!hook.events.includes("*") && !hook.events.includes(event)) continue;
        
        fetch(hook.url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-TrackCodex-Event': event,
                'X-TrackCodex-Signature': hook.secret ? require('crypto').createHmac('sha256', hook.secret).update(JSON.stringify(payload)).digest('hex') : ''
            },
            body: JSON.stringify({ event, payload })
        }).catch((err: any) => console.error('Webhook payload failed:', err.message));
    }
}
