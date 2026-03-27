/**
 * Build Service
 * Orchestrates the build pipeline: clone → install → build → upload to R2.
 *
 * Flow:
 *   1. Create a ProjectDeployment record (status: BUILDING)
 *   2. Clone the repo from the connected Git provider
 *   3. Run install + build commands
 *   4. Upload dist/ output to Cloudflare R2
 *   5. Update Cloudflare KV with the active deployment
 *   6. Mark deployment as READY
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { prisma } from "./prisma";
import { R2Service } from "./r2Service";
import { CloudflareService } from "./cfService";

const execAsync = promisify(exec);

interface BuildResult {
  success: boolean;
  deploymentId: string;
  url?: string;
  duration?: number;
  artifactSize?: number;
  error?: string;
  logs: string[];
}

export class BuildService {
  /**
   * Trigger a full build+deploy pipeline for a project.
   * This runs asynchronously — returns immediately with the deployment ID.
   */
  static async triggerBuild(
    projectId: string,
    userId: string,
    options?: {
      branch?: string;
      commitHash?: string;
      commitMsg?: string;
      environment?: string;
    },
  ): Promise<{ deploymentId: string }> {
    // 1. Load project
    const project = await prisma.deployProject.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error("Project not found");

    // 2. Create deployment record
    const slug = project.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const deployment = await prisma.projectDeployment.create({
      data: {
        projectId,
        status: "Building",
        environment: options?.environment || "Production",
        branch: options?.branch || "main",
        commitHash: options?.commitHash || "",
        commitMsg: options?.commitMsg || "Manual deployment via dashboard",
        url: `${slug}.trackcodex.com`,
        createdBy: userId,
        buildStartedAt: new Date(),
      },
    });

    // 3. Update project build status
    await prisma.deployProject.update({
      where: { id: projectId },
      data: { buildStatus: "BUILDING" },
    });

    // 4. Run build pipeline asynchronously
    BuildService.runPipeline(project, deployment.id, slug).catch((err) => {
      console.error(`❌ [BuildService] Pipeline failed for ${deployment.id}:`, err);
    });

    return { deploymentId: deployment.id };
  }

  /**
   * The actual build pipeline. Runs in the background.
   */
  private static async runPipeline(
    project: any,
    deploymentId: string,
    slug: string,
  ): Promise<BuildResult> {
    const logs: string[] = [];
    const startTime = Date.now();

    const log = (msg: string) => {
      const timestamp = new Date().toISOString();
      logs.push(`[${timestamp}] ${msg}`);
      console.log(`🔨 [Build ${deploymentId.slice(0, 8)}] ${msg}`);
    };

    try {
      // ── Step 1: Create temp working directory ──────────────
      const workDir = path.join(os.tmpdir(), `trackcodex-build-${deploymentId.slice(0, 8)}`);
      fs.mkdirSync(workDir, { recursive: true });
      log(`Created working directory: ${workDir}`);

      // ── Step 2: Clone repository ──────────────────────────
      if (!project.repoUrl) {
        throw new Error("No repository URL configured for this project");
      }

      log(`Cloning ${project.repoUrl}...`);
      await BuildService.runCommand(
        `git clone --depth 1 --branch ${project.branch || "main"} ${project.repoUrl} .`,
        workDir,
        logs,
      );
      log("Repository cloned successfully");

      // ── Step 3: Navigate to root directory ────────────────
      const buildDir = path.join(workDir, project.rootDir || "./");
      log(`Working directory: ${buildDir}`);

      // ── Step 4: Install dependencies ──────────────────────
      const installCmd = project.installCommand || "npm install";
      log(`Installing dependencies: ${installCmd}`);
      await BuildService.runCommand(installCmd, buildDir, logs);
      log("Dependencies installed");

      // ── Step 5: Run build command ─────────────────────────
      const buildCmd = project.buildCommand || "npm run build";
      log(`Running build: ${buildCmd}`);

      // Pass environment variables
      const envVars: Record<string, string> = {};
      if (project.envVars && Array.isArray(project.envVars)) {
        for (const ev of project.envVars) {
          if (ev.key && ev.value) {
            envVars[ev.key] = ev.value;
          }
        }
      }

      await BuildService.runCommand(buildCmd, buildDir, logs, envVars);
      log("Build completed successfully");

      // ── Step 6: Locate output directory ───────────────────
      const outputDir = path.join(buildDir, project.outputDir || "dist");
      if (!fs.existsSync(outputDir)) {
        throw new Error(
          `Build output directory not found: ${project.outputDir || "dist"}. ` +
          `Check your build command and output directory settings.`,
        );
      }
      log(`Build output found at: ${outputDir}`);

      // ── Step 7: Upload to Cloudflare R2 ───────────────────
      const r2Prefix = `${slug}/${deploymentId}`;
      log(`Uploading to R2 via Worker: ${r2Prefix}`);

      const uploadResult = await R2Service.uploadDirectory(slug, deploymentId, outputDir);
      log(`Uploaded ${uploadResult.totalFiles} files (${(uploadResult.totalSize / 1024).toFixed(1)} KB)`);

      // Upload deployment metadata
      await R2Service.uploadMeta(slug, deploymentId, {
        projectId: project.id,
        deploymentId,
        slug,
        framework: project.framework,
        branch: project.branch || "main",
        buildTime: Date.now() - startTime,
        files: uploadResult.totalFiles,
        size: uploadResult.totalSize,
        builtAt: new Date().toISOString(),
      });

      // ── Step 8: Update Cloudflare KV routing ──────────────
      log("Updating edge routing...");
      await CloudflareService.updateSiteRouting(slug, {
        projectSlug: slug,
        deployId: deploymentId,
        projectId: project.id,
      });
      log("Edge routing updated");

      // ── Step 9: Cleanup temp directory ─────────────────────
      fs.rmSync(workDir, { recursive: true, force: true });
      log("Cleaned up build directory");

      // ── Step 10: Update database records ───────────────────
      const duration = Math.round((Date.now() - startTime) / 1000);
      const deployUrl = `${slug}.trackcodex.com`;

      await prisma.projectDeployment.update({
        where: { id: deploymentId },
        data: {
          status: "Ready",
          duration,
          url: deployUrl,
          buildLogs: logs.join("\n"),
          artifactUrl: r2Prefix,
          artifactSize: uploadResult.totalSize,
          buildEndedAt: new Date(),
        },
      });

      await prisma.deployProject.update({
        where: { id: project.id },
        data: {
          buildStatus: "READY",
          activeDeployId: deploymentId,
          lastBuildAt: new Date(),
          lastBuildLogs: logs.join("\n"),
          r2BucketPath: slug,
          status: "Active",
        },
      });

      log(`✅ Deployment complete! Live at: https://${deployUrl}`);

      return {
        success: true,
        deploymentId,
        url: deployUrl,
        duration,
        artifactSize: uploadResult.totalSize,
        logs,
      };
    } catch (error: any) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      log(`❌ Build failed: ${error.message}`);

      // Update records with failure
      await prisma.projectDeployment.update({
        where: { id: deploymentId },
        data: {
          status: "Error",
          duration,
          buildLogs: logs.join("\n"),
          buildEndedAt: new Date(),
        },
      });

      await prisma.deployProject.update({
        where: { id: project.id },
        data: {
          buildStatus: "ERROR",
          lastBuildAt: new Date(),
          lastBuildLogs: logs.join("\n"),
        },
      });

      return {
        success: false,
        deploymentId,
        duration,
        error: error.message,
        logs,
      };
    }
  }

  /**
   * Execute a shell command and capture output.
   */
  private static async runCommand(
    cmd: string,
    cwd: string,
    logs: string[],
    env?: Record<string, string>,
  ): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd,
        timeout: 300_000, // 5 min timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: { ...process.env, ...env },
      });

      if (stdout) {
        const lines = stdout.trim().split("\n").slice(-5); // Last 5 lines
        lines.forEach((l) => logs.push(`  ${l}`));
      }
      if (stderr) {
        const lines = stderr.trim().split("\n").slice(-3);
        lines.forEach((l) => logs.push(`  ⚠ ${l}`));
      }

      return stdout;
    } catch (error: any) {
      if (error.stderr) {
        logs.push(`  ❌ ${error.stderr.trim().split("\n").slice(-3).join("\n  ")}`);
      }
      throw error;
    }
  }

  /**
   * Rollback to a previous deployment by updating the KV routing.
   */
  static async rollback(
    projectId: string,
    targetDeploymentId: string,
  ): Promise<void> {
    const project = await prisma.deployProject.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new Error("Project not found");

    const deployment = await prisma.projectDeployment.findUnique({
      where: { id: targetDeploymentId },
    });
    if (!deployment || deployment.projectId !== projectId) {
      throw new Error("Deployment not found");
    }
    if (!deployment.artifactUrl) {
      throw new Error("Deployment has no artifacts to rollback to");
    }

    const slug = project.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Update KV to point to the old deployment
    await CloudflareService.updateSiteRouting(slug, {
      projectSlug: slug,
      deployId: targetDeploymentId,
      projectId,
    });

    // Update DB
    await prisma.deployProject.update({
      where: { id: projectId },
      data: { activeDeployId: targetDeploymentId },
    });

    console.log(`↩️ [BuildService] Rolled back ${slug} to deployment ${targetDeploymentId.slice(0, 8)}`);
  }
}
