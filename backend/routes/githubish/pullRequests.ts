import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { GitStorageService } from "../../services/git/gitStorageService";
import { RealtimeService } from "../../services/infra/realtime";
import path from "path";

export const githubPullRequestsRoutes: FastifyPluginAsync = async (server) => {
    // POST /github/:id/pulls — create a PR
    server.post("/:id/pulls", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { title, body, source_branch, target_branch } = request.body as { 
            title: string; body?: string; source_branch: string; target_branch: string;
        };
        const user = (request as any).user;

        try {
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

            triggerWebhooks(id, "pull_request_opened", pullRequest).catch(console.error);
            
            RealtimeService.broadcastGlobal({
                type: "PR_UPDATED",
                data: pullRequest
            });

            return reply.code(201).send(pullRequest);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // GET /github/:id/pulls — list PRs for a repo
    server.get("/:id/pulls", { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.query as { status?: string };
        try {
            const prs = await prisma.pullRequest.findMany({
                where: { repoId: id, ...(status ? { status: status.toUpperCase() } : {}) },
                include: { author: { select: { username: true, name: true, avatar: true } } },
                orderBy: { createdAt: 'desc' }
            });
            return prs;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // GET /github/pulls/:prId — get a single PR with diff
    server.get("/pulls/:prId", async (request, reply) => {
        const { prId } = request.params as { prId: string };
        
        try {
            const pr = await prisma.pullRequest.findUnique({ where: { id: prId } });
            if (!pr) return reply.code(404).send({ error: "Not found" });
            
            const repo = await prisma.repository.findUnique({ where: { id: pr.repoId } });
            if (!repo) return reply.code(404).send({ error: "Repo not found" });

            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            const repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            
            let diffStr = "";
            try {
                diffStr = await GitStorageService.compareBranches(repoPath, pr.base, pr.head);
            } catch { /* empty repo or no commits — diff is empty */ }
            
            return { ...pr, diff: diffStr };
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // POST /github/pulls/:prId/merge — merge a PR
    server.post("/pulls/:prId/merge", { preHandler: requireAuth }, async (request, reply) => {
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

            RealtimeService.broadcastGlobal({
                type: "PR_UPDATED",
                data: updatedPr
            });

            return { success: true, pr: updatedPr };
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};

async function triggerWebhooks(repoId: string, event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({ where: { repoId, active: true } });
    const crypto = await import('crypto');
    for (const hook of webhooks) {
        if (!hook.events.includes("*") && !hook.events.includes(event)) continue;
        
        const signature = hook.secret 
            ? crypto.createHmac('sha256', hook.secret).update(JSON.stringify(payload)).digest('hex') 
            : '';

        fetch(hook.url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-TrackCodex-Event': event,
                'X-TrackCodex-Signature': signature
            },
            body: JSON.stringify({ event, payload })
        }).catch((err: any) => console.error('Webhook payload failed:', err.message));
    }
}
