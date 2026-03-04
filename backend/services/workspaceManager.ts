import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { AutoSyncService } from "./autoSyncService";
import { DockerService } from "./docker";
import getPort from "get-port";
import { env } from "../config/env";

// OpenVSCode Server URL (Docker service on port 8080)
const OPENVSCODE_URL = process.env.OPENVSCODE_URL || "http://localhost:8080";
const OPENVSCODE_TOKEN = process.env.OPENVSCODE_TOKEN || "trackcodex";

// Local workspaces directory — bind-mounted into the Docker container at /home/workspace
const WORKSPACES_ROOT = path.join(process.cwd(), "workspaces");

export class WorkspaceManager {
  /**
   * Start a workspace for a given repo.
   * Clones the repo from the remote source if not already cloned, then
   * returns the OpenVSCode Server URL pointing to the folder.
   */
  static async startWorkspace(
    workspaceId: string,
    options?: { repoName?: string; cloneUrl?: string; liveSync?: boolean },
  ): Promise<{ url: string; port: number }> {
    try {
      const repoName = options?.repoName || workspaceId;
      const workspacePath = path.join(WORKSPACES_ROOT, repoName);

      // Ensure workspaces root exists
      if (!fs.existsSync(WORKSPACES_ROOT)) {
        fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
      }

      // Clone if folder doesn't exist yet
      if (!fs.existsSync(workspacePath) && options?.cloneUrl) {
        console.warn(`[WorkspaceManager] Cloning ${options.cloneUrl} → ${workspacePath}`);
        try {
          // git clone creates the target directory itself — don't pre-create it
          execSync(`git clone "${options.cloneUrl}" "${workspacePath}"`, {
            stdio: "pipe",
            timeout: 60000,
          });
          console.warn(`[WorkspaceManager] Clone complete: ${repoName}`);
        } catch (cloneErr: unknown) {
          const msg = cloneErr instanceof Error ? cloneErr.message : String(cloneErr);
          console.error(`[WorkspaceManager] Clone failed: ${msg}`);
          // Create empty directory so IDE still opens
          if (!fs.existsSync(workspacePath)) {
            fs.mkdirSync(workspacePath, { recursive: true });
          }
        }
      } else if (!fs.existsSync(workspacePath)) {
        // No clone URL — create empty workspace directory
        fs.mkdirSync(workspacePath, { recursive: true });
      }

      // --- Provision Dedicated Docker Container ---
      console.warn(`[WorkspaceManager] Provisioning container for ${repoName}...`);

      // 1. Find a free port on the host
      const port = await getPort({
        port: [3000, 3001, 3002, 3003, 3004, 3005, 3000 + Math.floor(Math.random() * 1000)]
      });

      // 2. Start the container via DockerService
      // Note: DockerService.createContainer handles removing old ones and starting the new one
      const { port: hostPort } = await DockerService.createContainer(workspaceId, "gitpod/openvscode-server:latest", port);

      // 3. Build the IDE URL
      // Use the frontend's origin hostname or env.BACKEND_URL to ensure it's reachable
      const host = env.BACKEND_URL.replace(/https?:\/\//, "").split(":")[0];
      const protocol = env.BACKEND_URL.startsWith("https") ? "https" : "http";
      const url = `${protocol}://${host}:${hostPort}/?folder=/home/workspace`;

      console.warn(`[WorkspaceManager] IDE URL (Provisioned): ${url}`);

      // Start Auto-Sync if requested
      if (options?.liveSync) {
        AutoSyncService.start(workspacePath, workspaceId);
      }

      return { url, port: hostPort };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[WorkspaceManager] Failed: ${msg}`);
      return {
        url: `${OPENVSCODE_URL}/?tkn=${OPENVSCODE_TOKEN}`,
        port: 8080,
      };
    }
  }

  static async stopWorkspace(workspaceId: string) {
    AutoSyncService.stop(workspaceId);
    console.warn(`[WorkspaceManager] Stopped tracking workspace ${workspaceId}`);
  }
}
