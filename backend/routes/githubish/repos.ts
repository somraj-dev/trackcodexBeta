import { FastifyPluginAsync } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { GitStorageService } from "../../services/git/gitStorageService";
import path from "path";

export const githubReposRoutes: FastifyPluginAsync = async (server) => {
    // Apply authentication middleware to all routes in this plugin
    server.addHook("preHandler", requireAuth);

    // Create a new repository
    server.post("/", async (request, reply) => {
        const { name, visibility } = request.body as { name: string; visibility?: string };
        const user = (request as any).user;

        try {
            const repoPath = await GitStorageService.initBareRepo(user.userId, name);
            
            const repository = await prisma.repository.create({
                data: {
                    name,
                    ownerId: user.userId,
                    visibility: visibility ? visibility.toUpperCase() : "PUBLIC",
                    isPublic: visibility === "public",
                }
            });

            return reply.code(201).send(repository);
        } catch (err: any) {
            server.log.error(err);
            return reply.code(500).send({ error: "Internal Server Error", message: err.message });
        }
    });

    // Get repo metadata
    server.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            const repo = await prisma.repository.findUnique({ where: { id } });
            if (!repo) return reply.code(404).send({ error: "Not found" });
            return repo;
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // List branches
    server.get("/:id/branches", async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = (request as any).user;
        try {
            const repo = await prisma.repository.findUnique({ where: { id } });
            if (!repo) return reply.code(404).send({ error: "Not found" });
            
            // Reconstruct the repo path based on our storage logic
            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            let repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            const fs = await import("fs");
            if (!fs.existsSync(repoPath)) {
                const { GitServer } = await import("../../services/git/gitServer");
                repoPath = new GitServer().getRepoPath(repo.id);
            }
            
            const branches = await GitStorageService.listBranches(repoPath);
            return { branches };
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // Get File Tree
    server.get("/:id/tree", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { branch } = request.query as { branch?: string };
        try {
            const repo = await prisma.repository.findUnique({ where: { id } });
            if (!repo) return reply.code(404).send({ error: "Not found" });
            
            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            let repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            const fs = await import("fs");
            if (!fs.existsSync(repoPath)) {
                const { GitServer } = await import("../../services/git/gitServer");
                repoPath = new GitServer().getRepoPath(repo.id);
            }
            
            const tree = await GitStorageService.listFiles(repoPath, branch || "master");
            return { tree };
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });

    // Get Raw Blob
    server.get("/:id/blob", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { branch, filepath } = request.query as { branch?: string; filepath: string };
        
        if (!filepath) return reply.code(400).send({ error: "file path is required" });

        try {
            const repo = await prisma.repository.findUnique({ where: { id } });
            if (!repo) return reply.code(404).send({ error: "Not found" });
            
            const { GIT_ROOT } = await import("../../services/git/gitStorageService");
            let repoPath = path.join(GIT_ROOT, String(repo.ownerId), `${repo.name}.git`);
            const fs = await import("fs");
            if (!fs.existsSync(repoPath)) {
                const { GitServer } = await import("../../services/git/gitServer");
                repoPath = new GitServer().getRepoPath(repo.id);
            }
            
            const content = await GitStorageService.getFileContent(repoPath, branch || "master", filepath);
            
            const ext = path.extname(filepath);
            const mimeTypes: Record<string, string> = { 
                '.json': 'application/json', '.html': 'text/html', 
                '.js': 'application/javascript', '.ts': 'application/javascript', 
                '.md': 'text/markdown' 
            };
            
            reply.header('Content-Type', mimeTypes[ext] || 'text/plain');
            return reply.send(content);
        } catch (err) {
            return reply.code(500).send({ error: "Internal Server Error" });
        }
    });
};
