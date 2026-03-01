import { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma";
import { gitService } from "../services/gitService";
import { requireAuth } from "../middleware/auth";
import bcrypt from "bcryptjs";
import {
  BadRequest,
  NotFound,
  InternalError,
  Unauthorized,
} from "../utils/AppError";

// Shared prisma instance

export async function workspaceRoutes(fastify: FastifyInstance) {
  // Health Check
  fastify.get("/workspaces/health", async () => {
    return { status: "ok" };
  });

  // List Workspaces
  fastify.get("/workspaces", async (request, reply) => {
    try {
      // In real app: use request.user.id to filter
      const workspaces = await prisma.workspace.findMany({
        include: { owner: true },
        orderBy: { updatedAt: "desc" },
      });
      return workspaces;
    } catch (error) {
      throw error; // Let global handler catch
    }
  });

  // Create Workspace
  fastify.post(
    "/workspaces",
    { preHandler: requireAuth },
    async (request, reply) => {
      const {
        name,
        description,
        repositoryUrl,
        gitProvider,
        setupMode,
        visibility,
        accessPassword,
      } = request.body as any;

      const user = (request as any).user;
      if (!user) throw Unauthorized("Unauthorized");
      const finalOwnerId = user.userId;

      // Validate repository URL if provided
      if (setupMode === "import" && repositoryUrl) {
        const repoInfo = await gitService.getRepositoryInfo(repositoryUrl);
        if (!repoInfo.isValid) {
          return reply.code(400).send({
            message:
              "Invalid Git repository URL. Please provide a valid GitHub, GitLab, or Bitbucket URL.",
          });
        }
      }

      // Hash password if provided
      let hashedPassword = null;
      if (visibility === "private" && accessPassword) {
        hashedPassword = await bcrypt.hash(accessPassword, 10);
      }

      // Create workspace with repository info
      const workspace = await prisma.workspace.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: finalOwnerId,
          status:
            setupMode === "import" && repositoryUrl ? "Cloning" : "Active",
          repoUrl: repositoryUrl || null,
          visibility: visibility || "public",
          accessPassword: hashedPassword,
          members: {
            create: {
              userId: finalOwnerId,
              role: "OWNER",
            },
          },
        },
      });

      const { NotificationService } = await import("../services/notification");
      await NotificationService.create(
        finalOwnerId,
        "system",
        "Workspace Provisioned",
        `New cloud development environment allocated for: ${workspace.name}`,
        `/workspaces/${workspace.id}`,
        { workspaceId: workspace.id }
      );

      // If repository URL provided, trigger real cloning in background
      if (setupMode === "import" && repositoryUrl) {
        // Log the cloning request
        request.log.info(
          `Cloning repository: ${repositoryUrl} (${gitProvider}) for workspace ${workspace.id}`,
        );

        // Clone repository asynchronously (don't block response)
        (async () => {
          try {
            // Clone the repository
            const clonedPath = await gitService.cloneRepository(
              repositoryUrl,
              workspace.id,
            );

            // Update workspace status to Ready
            await prisma.workspace.update({
              where: { id: workspace.id },
              data: { status: "Ready" },
            });

            request.log.info(
              `Repository cloned successfully to ${clonedPath} for workspace ${workspace.id}`,
            );
          } catch (error: any) {
            request.log.error(
              `Failed to clone repository for workspace ${workspace.id}: ${error.message}`,
            );

            // Update workspace status to Failed
            await prisma.workspace.update({
              where: { id: workspace.id },
              data: { status: "Failed" },
            });
          }
        })();
      }

      return workspace;
    });

  // Get Workspace Details
  fastify.get("/workspaces/:id", async (request, reply) => {
    const { id } = request.params as any;
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!workspace) {
      throw NotFound("Workspace not found");
    }
    return workspace;
  });

  // Start Workspace IDE
  fastify.post("/workspaces/:id/start", async (request, reply) => {
    const { id } = request.params as any;
    const { repoId, liveSync } = (request.body as any) || {};

    // Look up repo details FIRST (before creating workspace)
    let repoName: string | undefined;
    let cloneUrl: string | undefined;
    let repoDisplayName: string | undefined;

    if (repoId) {
      const repo = await prisma.repository.findUnique({ where: { id: repoId } });
      if (repo) {
        repoDisplayName = repo.name;
        repoName = repo.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");
        cloneUrl = repo.cloneUrl || undefined;
        request.log.info(`[Workspace] Starting IDE for repo: ${repo.name} (${repoName}), clone: ${cloneUrl}`);
      }
    }

    // Ensure workspace exists
    let workspace = await prisma.workspace.findUnique({ where: { id } });

    if (!workspace) {
      const defaultOwner = await prisma.user.findFirst();
      if (!defaultOwner) {
        throw InternalError("System Error: No users available to own workspace.");
      }

      workspace = await prisma.workspace.create({
        data: {
          id,
          name: repoDisplayName || `Workspace ${id.substring(0, 6)}`,
          description: repoDisplayName ? `IDE for ${repoDisplayName}` : "Auto-created workspace",
          ownerId: defaultOwner.id,
          status: "Starting",
        },
      });
    }

    try {
      const { WorkspaceManager } = await import("../services/workspaceManager");

      const result = await WorkspaceManager.startWorkspace(id, {
        repoName,
        cloneUrl,
        liveSync,
      });

      // Update status
      await prisma.workspace.update({
        where: { id },
        data: { status: "Running" },
      });

      return result;
    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  // Update Status
  fastify.patch("/workspaces/:id/status", async (request, reply) => {
    const { id } = request.params as any;
    const { status } = request.body as any;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { status },
    });

    return workspace;
  });

  // Delete Workspace
  fastify.delete("/workspaces/:id", async (request, reply) => {
    const { id } = request.params as any;

    try {
      // Get workspace to check if it has a cloned repository
      const workspace = await prisma.workspace.findUnique({
        where: { id },
      });

      if (!workspace) {
        return reply.code(404).send({ message: "Workspace not found" });
      }

      // Delete the cloned repository if it exists
      if (workspace.repoUrl) {
        try {
          await gitService.deleteWorkspace(id);
          request.log.info(`Deleted cloned repository for workspace ${id}`);
        } catch (error: any) {
          request.log.warn(
            `Failed to delete repository for workspace ${id}: ${error.message}`,
          );
          // Continue with workspace deletion even if repo cleanup fails
        }
      }

      // Delete workspace from database
      await prisma.workspace.delete({
        where: { id },
      });

      return { message: "Workspace deleted successfully", id };
    } catch (error: any) {
      request.log.error(`Failed to delete workspace ${id}: ${error.message}`);
      return reply.code(500).send({
        message: "Failed to delete workspace",
        error: error.message,
      });
    }
  });
}
