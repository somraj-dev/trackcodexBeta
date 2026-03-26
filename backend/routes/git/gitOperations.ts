import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { GitOperationsService } from "../../services/git/gitOperationsService";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../services/infra/prisma";

/**
 * TrackCodex Native Git Operations Routes
 * 
 * All endpoints operate on TrackCodex's own Git infrastructure.
 * No GitHub/GitLab dependency — this IS TrackCodex's Git platform.
 */
export default async function gitOperationsRoutes(server: FastifyInstance) {
  // All routes require authentication
  server.addHook("preHandler", requireAuth);

  // ─── Helper: resolve repoId and verify access ───────────────
  async function resolveRepo(request: FastifyRequest, reply: FastifyReply) {
    const { repoId } = request.params as { repoId: string };
    const repo = await prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) {
      reply.code(404).send({ error: "Repository not found" });
      return null;
    }
    return repo;
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    COMMIT ENDPOINTS                      ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/commits — Commit history
  server.get("/repos/:repoId/commits", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { branch, limit, offset } = request.query as {
      branch?: string;
      limit?: string;
      offset?: string;
    };

    const commits = await GitOperationsService.getCommits(repo.id, {
      branch,
      limit: limit ? parseInt(limit, 10) : 30,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return { commits, total: commits.length };
  });

  // GET /repos/:repoId/commits/:sha — Single commit detail
  server.get("/repos/:repoId/commits/:sha", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { sha } = request.params as { sha: string };
    const commit = await GitOperationsService.getCommit(repo.id, sha);

    if (!commit) return reply.code(404).send({ error: "Commit not found" });

    // Also fetch the diff for this commit
    const diff = await GitOperationsService.getDiff(repo.id, sha);

    return { commit, diff };
  });

  // POST /repos/:repoId/commits — Create commit (web editor)
  server.post("/repos/:repoId/commits", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { branch, files, message, author } = request.body as {
      branch: string;
      files: { path: string; content: string }[];
      message: string;
      author?: { name: string; email: string };
    };

    if (!branch || !files || !message) {
      return reply.code(400).send({ error: "branch, files, and message are required" });
    }

    const user = (request as any).user;

    const result = await GitOperationsService.createCommit(
      repo.id,
      branch,
      files,
      message,
      author || { name: user.username || "TrackCodex User", email: user.email || "user@trackcodex.com" }
    );

    if (!result) return reply.code(500).send({ error: "Failed to create commit" });
    return reply.code(201).send(result);
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     DIFF ENDPOINTS                       ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/diff — Diff between refs
  server.get("/repos/:repoId/diff", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { from, to } = request.query as { from: string; to?: string };
    if (!from) return reply.code(400).send({ error: "'from' ref is required" });

    const diff = await GitOperationsService.getDiff(repo.id, from, to);
    return diff;
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                   BRANCH ENDPOINTS                       ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/branches — List branches
  server.get("/repos/:repoId/branches", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const branches = await GitOperationsService.getBranches(repo.id);
    return { branches };
  });

  // POST /repos/:repoId/branches — Create branch
  server.post("/repos/:repoId/branches", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { name, startPoint } = request.body as { name: string; startPoint?: string };
    if (!name) return reply.code(400).send({ error: "Branch name is required" });

    const result = await GitOperationsService.createBranch(repo.id, name, startPoint);
    if (!result.success) return reply.code(400).send({ error: result.error });
    return reply.code(201).send({ branch: name });
  });

  // DELETE /repos/:repoId/branches/:name — Delete branch
  server.delete("/repos/:repoId/branches/:name", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { name } = request.params as { name: string };
    const result = await GitOperationsService.deleteBranch(repo.id, name);
    if (!result.success) return reply.code(400).send({ error: result.error });
    return { deleted: name };
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                     TAG ENDPOINTS                        ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/tags — List tags
  server.get("/repos/:repoId/tags", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const tags = await GitOperationsService.getTags(repo.id);
    return { tags };
  });

  // POST /repos/:repoId/tags — Create tag
  server.post("/repos/:repoId/tags", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { name, ref, message } = request.body as {
      name: string;
      ref?: string;
      message?: string;
    };
    if (!name) return reply.code(400).send({ error: "Tag name is required" });

    const result = await GitOperationsService.createTag(repo.id, name, ref, message);
    if (!result.success) return reply.code(400).send({ error: result.error });
    return reply.code(201).send({ tag: name });
  });

  // DELETE /repos/:repoId/tags/:name — Delete tag
  server.delete("/repos/:repoId/tags/:name", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { name } = request.params as { name: string };
    const result = await GitOperationsService.deleteTag(repo.id, name);
    if (!result.success) return reply.code(400).send({ error: result.error });
    return { deleted: name };
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    BLAME ENDPOINT                        ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/blame — File blame
  server.get("/repos/:repoId/blame", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { filepath, ref } = request.query as { filepath: string; ref?: string };
    if (!filepath) return reply.code(400).send({ error: "'filepath' is required" });

    const blame = await GitOperationsService.getBlame(repo.id, filepath, ref);
    return { blame };
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                    MERGE ENDPOINT                        ║
  // ╚══════════════════════════════════════════════════════════╝

  // POST /repos/:repoId/merge — Merge branches
  server.post("/repos/:repoId/merge", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { source, target, message } = request.body as {
      source: string;
      target: string;
      message?: string;
    };

    if (!source || !target) {
      return reply.code(400).send({ error: "'source' and 'target' branches are required" });
    }

    const result = await GitOperationsService.merge(repo.id, source, target, message);
    if (!result.success) {
      return reply.code(409).send({
        error: result.error,
        conflicts: result.conflicts,
      });
    }
    return result;
  });

  // ╔══════════════════════════════════════════════════════════╗
  // ║                 TREE / FILE ENDPOINTS                    ║
  // ╚══════════════════════════════════════════════════════════╝

  // GET /repos/:repoId/tree — Browse directory tree
  server.get("/repos/:repoId/tree", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { ref, path: dirPath } = request.query as { ref?: string; path?: string };
    const tree = await GitOperationsService.getTree(repo.id, ref, dirPath);
    return { tree };
  });

  // GET /repos/:repoId/file — Get file content
  server.get("/repos/:repoId/file", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const { ref, filepath } = request.query as { ref?: string; filepath: string };
    if (!filepath) return reply.code(400).send({ error: "'filepath' is required" });

    const content = await GitOperationsService.getFileContent(repo.id, ref || "HEAD", filepath);
    if (content === null) return reply.code(404).send({ error: "File not found" });

    return { filepath, ref: ref || "HEAD", content };
  });

  // GET /repos/:repoId/summary — Repo summary (branches, tags, last commit)
  server.get("/repos/:repoId/summary", async (request, reply) => {
    const repo = await resolveRepo(request, reply);
    if (!repo) return;

    const summary = await GitOperationsService.getRepoSummary(repo.id);
    return { ...repo, git: summary };
  });
}
