import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { AppError, NotFound } from "../../utils/AppError";
import { requireAuth } from "../../middleware/auth";
import { CloudflareService } from "../../services/infra/cfService";
import { BuildService } from "../../services/infra/buildService";

export async function projectRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);

  // ─── LIST all projects for current user ────────────────────────
  fastify.get("/projects", async (request) => {
    const user = (request as any).user;
    if (!user) throw new AppError("Unauthorized", 401);

    const projects = await prisma.deployProject.findMany({
      where: { ownerId: user.userId },
      include: {
        customDomains: true,
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true, status: true, branch: true,
            commitHash: true, commitMsg: true, url: true,
            duration: true, environment: true, createdAt: true, createdBy: true,
          },
        },
        _count: { select: { deployments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain || p.customDomains[0]?.domain || `${p.name}.trackcodex.app`,
      logo: p.logo,
      logoBg: p.logoBg,
      repoUrl: p.repoUrl,
      repoOwner: p.repoOwner,
      repoName: p.repoName,
      framework: p.framework,
      status: p.status,
      commitMsg: p.deployments[0]?.commitMsg || "No deployments yet",
      deployDate: p.deployments[0]?.createdAt || p.createdAt,
      branch: p.deployments[0]?.branch || "main",
      lastDeployment: p.deployments[0] || null,
      deploymentCount: p._count.deployments,
      analyticsEnabled: p.analyticsEnabled,
      speedInsightsEnabled: p.speedInsightsEnabled,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  });

  // ─── CREATE a project ──────────────────────────────────────────
  fastify.post("/projects", async (request) => {
    const user = (request as any).user;
    if (!user) throw new AppError("Unauthorized", 401);
    const body = request.body as any;

    const project = await prisma.deployProject.create({
      data: {
        name: body.name,
        domain: body.domain || null,
        logo: body.logo || "⬡",
        logoBg: body.logoBg || "#111",
        repoUrl: body.repoUrl || null,
        repoOwner: body.repoOwner || null,
        repoName: body.repoName || null,
        framework: body.framework || "Other",
        buildCommand: body.buildCommand || "npm run build",
        outputDir: body.outputDir || "dist",
        installCommand: body.installCommand || "npm install",
        rootDir: body.rootDir || "./",
        nodeVersion: body.nodeVersion || "18.x",
        envVars: body.envVars || [],
        ownerId: user.userId,
      },
    });

    // Auto-create initial deployment
    await prisma.projectDeployment.create({
      data: {
        projectId: project.id,
        status: "Ready",
        environment: "Production",
        branch: "main",
        commitHash: project.id.substring(0, 7),
        commitMsg: body.commitMsg || `feat: Initial deployment via TrackCodex`,
        url: `${project.name.toLowerCase().replace(/\s+/g, "-")}-quantaforze.trackcodex.app`,
        duration: Math.floor(Math.random() * 60) + 30,
        createdBy: user.userId,
      },
    });

    return project;
  });

  // ─── GET single project with full details ──────────────────────
  fastify.get("/projects/:id", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({
      where: { id },
      include: {
        customDomains: true,
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    const latestDeploy = project.deployments[0];

    return {
      ...project,
      // Computed fields for the frontend
      deployUrl: latestDeploy?.url || `${project.name.toLowerCase().replace(/\s+/g, "-")}-quantaforze.trackcodex.app`,
      altDomain: project.customDomains.length > 1 ? project.customDomains[1]?.domain : null,
      latestStatus: latestDeploy?.status || "No deploys",
      createdAgo: latestDeploy?.createdAt || project.createdAt,
      createdBy: latestDeploy?.createdBy || user.userId,
      commitHash: latestDeploy?.commitHash || "0000000",
      commitMsg: latestDeploy?.commitMsg || "No deployments yet",
      latestBranch: latestDeploy?.branch || "main",
      checklist: [
        { label: "Connect Git Repository", done: !!project.repoUrl },
        { label: "Add Custom Domain", done: project.customDomains.length > 0 },
        { label: "Preview Deployment", done: project.deployments.some((d) => d.environment === "Preview") },
        { label: "Enable Web Analytics", done: project.analyticsEnabled },
        { label: "Enable Speed Insights", done: project.speedInsightsEnabled },
      ],
      edgeReqs: Math.floor(Math.random() * 500),
      fnInvocations: 0,
      errorRate: "0%",
    };
  });

  // ─── UPDATE project ────────────────────────────────────────────
  fastify.put("/projects/:id", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    const updated = await prisma.deployProject.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        domain: body.domain ?? existing.domain,
        framework: body.framework ?? existing.framework,
        repoUrl: body.repoUrl ?? existing.repoUrl,
        repoOwner: body.repoOwner ?? existing.repoOwner,
        repoName: body.repoName ?? existing.repoName,
        buildCommand: body.buildCommand ?? existing.buildCommand,
        outputDir: body.outputDir ?? existing.outputDir,
        installCommand: body.installCommand ?? existing.installCommand,
        rootDir: body.rootDir ?? existing.rootDir,
        nodeVersion: body.nodeVersion ?? existing.nodeVersion,
        envVars: body.envVars ?? existing.envVars,
        analyticsEnabled: body.analyticsEnabled ?? existing.analyticsEnabled,
        speedInsightsEnabled: body.speedInsightsEnabled ?? existing.speedInsightsEnabled,
        status: body.status ?? existing.status,
      },
    });

    return updated;
  });

  // ─── DELETE project ────────────────────────────────────────────
  fastify.delete("/projects/:id", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    await prisma.deployProject.delete({ where: { id } });
    return { success: true };
  });

  // ─── LIST deployments for a project ────────────────────────────
  fastify.get("/projects/:id/deployments", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    const query = request.query as any;
    const environment = query.environment;
    const deployments = await prisma.projectDeployment.findMany({
      where: {
        projectId: id,
        ...(environment && environment !== "All" ? { environment } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return deployments;
  });

  // ─── CREATE deployment (trigger build) ─────────────────────────
  fastify.post("/projects/:id/deployments", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    // If Cloudflare R2 is configured, use the real build pipeline
    if (process.env.CF_ACCOUNT_ID && process.env.CF_R2_ACCESS_KEY_ID) {
      const { BuildService } = await import("../../services/infra/buildService");
      const result = await BuildService.triggerBuild(id, user.userId, {
        branch: body.branch || "main",
        commitHash: body.commitHash,
        commitMsg: body.commitMsg || "Manual deployment via dashboard",
        environment: body.environment || "Production",
      });

      const deployment = await prisma.projectDeployment.findUnique({
        where: { id: result.deploymentId },
      });

      return deployment;
    }

    // Fallback: simulated deployment (no CF credentials)
    const deployment = await prisma.projectDeployment.create({
      data: {
        projectId: id,
        status: "Building",
        environment: body.environment || "Production",
        branch: body.branch || "main",
        commitHash: body.commitHash || Math.random().toString(36).substring(2, 9),
        commitMsg: body.commitMsg || "Manual deployment via dashboard",
        url: `${project.name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}.trackcodex.app`,
        createdBy: user.userId,
      },
    });

    // Simulate build completion after creation
    setTimeout(async () => {
      try {
        await prisma.projectDeployment.update({
          where: { id: deployment.id },
          data: {
            status: "Ready",
            duration: Math.floor(Math.random() * 90) + 20,
          },
        });
      } catch { /* ignored */ }
    }, 3000);

    return deployment;
  });

  // ─── LIST domains for a project ────────────────────────────────
  fastify.get("/projects/:id/domains", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.projectDomain.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
  });

  // ─── ADD domain to a project ───────────────────────────────────
  fastify.post("/projects/:id/domains", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    const domain = await prisma.projectDomain.create({
      data: {
        projectId: id,
        domain: body.domain,
        redirect: body.redirect || null,
        gitBranch: body.gitBranch || null,
      },
    });

    // Update project's primary domain if this is the first
    if (!project.domain) {
      await prisma.deployProject.update({
        where: { id },
        data: { domain: body.domain },
      });
    }

    return domain;
  });



  // ─── UPDATE project settings (build & deploy config) ───────────
  fastify.put("/projects/:id/settings", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.deployProject.update({
      where: { id },
      data: {
        buildCommand: body.buildCommand ?? existing.buildCommand,
        outputDir: body.outputDir ?? existing.outputDir,
        installCommand: body.installCommand ?? existing.installCommand,
        rootDir: body.rootDir ?? existing.rootDir,
        nodeVersion: body.nodeVersion ?? existing.nodeVersion,
        envVars: body.envVars ?? existing.envVars,
      },
    });
  });

  // ─── Toggle analytics ──────────────────────────────────────────
  fastify.post("/projects/:id/analytics/toggle", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.deployProject.update({
      where: { id },
      data: { analyticsEnabled: !existing.analyticsEnabled },
    });
  });

  // ─── Toggle speed insights ─────────────────────────────────────
  fastify.post("/projects/:id/speed-insights/toggle", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.deployProject.update({
      where: { id },
      data: { speedInsightsEnabled: !existing.speedInsightsEnabled },
    });
  });

  // ─── Environment Variables CRUD ────────────────────────────────
  fastify.get("/projects/:id/env", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return project.envVars || [];
  });

  fastify.put("/projects/:id/env", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    if (!user) throw new AppError("Unauthorized", 401);

    const existing = await prisma.deployProject.findUnique({ where: { id } });
    if (!existing) throw NotFound("Project not found");
    if (existing.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.deployProject.update({
      where: { id },
      data: { envVars: body.envVars || [] },
    });
  });

  // ─── GET build logs for a specific deployment ─────────────────
  fastify.get("/projects/:id/deployments/:did/logs", async (request) => {
    const user = (request as any).user;
    const { id, did } = request.params as { id: string; did: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    const deployment = await prisma.projectDeployment.findUnique({
      where: { id: did },
    });
    if (!deployment || deployment.projectId !== id) {
      throw NotFound("Deployment not found");
    }

    return {
      deploymentId: did,
      status: deployment.status,
      logs: deployment.buildLogs || "",
      duration: deployment.duration,
      artifactUrl: deployment.artifactUrl,
      artifactSize: deployment.artifactSize,
      buildStartedAt: deployment.buildStartedAt,
      buildEndedAt: deployment.buildEndedAt,
    };
  });

  // ─── POST rollback to a previous deployment ───────────────────
  fastify.post("/projects/:id/rollback/:did", async (request) => {
    const user = (request as any).user;
    const { id, did } = request.params as { id: string; did: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    if (process.env.CF_ACCOUNT_ID && process.env.CF_R2_ACCESS_KEY_ID) {
      const { BuildService } = await import("../../services/infra/buildService");
      await BuildService.rollback(id, did);
    } else {
      // Simulated rollback — just update the activeDeployId
      await prisma.deployProject.update({
        where: { id },
        data: { activeDeployId: did },
      });
    }

    return { message: "Rollback successful", deploymentId: did };
  });

  // ─── GET build status (for polling from frontend) ─────────────
  fastify.get("/projects/:id/build-status", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({
      where: { id },
      select: {
        buildStatus: true,
        activeDeployId: true,
        lastBuildAt: true,
      },
    });
    if (!project) throw NotFound("Project not found");

    // Get the latest deployment
    const latestDeploy = await prisma.projectDeployment.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        duration: true,
        url: true,
        buildStartedAt: true,
        buildEndedAt: true,
      },
    });

    return {
      buildStatus: project.buildStatus,
      activeDeployId: project.activeDeployId,
      lastBuildAt: project.lastBuildAt,
      latestDeployment: latestDeploy,
    };
  });

  // ─── DOMAINS ───────────────────────────────────────────────────

  // GET /projects/:id/domains
  fastify.get("/projects/:id/domains", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    return prisma.projectDomain.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });
  });

  // POST /projects/:id/domains
  fastify.post("/projects/:id/domains", async (request) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const { domain } = request.body as { domain: string };
    if (!user) throw new AppError("Unauthorized", 401);
    if (!domain) throw new AppError("Domain name is required", 400);

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project) throw NotFound("Project not found");
    if (project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    // 1. Create in database
    const newDomain = await prisma.projectDomain.create({
      data: {
        projectId: id,
        domain,
        verified: true, // Auto-verify for now in this proof-of-concept
      },
    });

    // 2. Update Cloudflare KV if project is active
    if (project.activeDeployId) {
      try {
        await CloudflareService.updateDomainRouting(domain, {
          projectSlug: project.name, // Use name as slug for now
          deployId: project.activeDeployId,
          projectId: project.id,
        });
      } catch (err) {
        console.error("Failed to update domain routing in KV:", err);
      }
    }

    return newDomain;
  });

  // DELETE /projects/:id/domains/:did
  fastify.delete("/projects/:id/domains/:did", async (request) => {
    const user = (request as any).user;
    const { id, did } = request.params as { id: string; did: string };
    if (!user) throw new AppError("Unauthorized", 401);

    const domain = await prisma.projectDomain.findUnique({ where: { id: did } });
    if (!domain || domain.projectId !== id) throw NotFound("Domain not found");

    const project = await prisma.deployProject.findUnique({ where: { id } });
    if (!project || project.ownerId !== user.userId) throw new AppError("Forbidden", 403);

    // 1. Delete from Cloudflare KV
    try {
      await CloudflareService.deleteDomainRouting(domain.domain);
    } catch (err) {
      console.error("Failed to delete domain routing in KV:", err);
    }

    // 2. Delete from database
    await prisma.projectDomain.delete({ where: { id: did } });

    return { success: true };
  });
}
