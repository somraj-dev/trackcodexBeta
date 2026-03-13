import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { AutoSyncService } from "./autoSyncService";

// OpenVSCode Server URL
const OPENVSCODE_URL = (process.env.OPENVSCODE_URL || "https://workspace.trackcodex.com").replace(/\/$/, ""); // Remove trailing slash
const OPENVSCODE_TOKEN = process.env.OPENVSCODE_TOKEN || "trackcodex";

console.warn(`[WorkspaceManager] Using IDE Host: ${OPENVSCODE_URL}`);

// Local workspaces directory — bind-mounted into the Docker container at /home/workspace
const WORKSPACES_ROOT = path.join(process.cwd(), "workspaces");

export class WorkspaceManager {
  /**
   * Start a workspace for a given repo.
   * Uses the shared OpenVSCode container from docker-compose, returning
   * a URL that points to the already-running IDE on port 8080.
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

      // Use the shared OpenVSCode container that is already running via docker-compose
      // It mounts ./workspaces:/home/workspace and listens on port 8080
      const ideHost = OPENVSCODE_URL;
      const url = `${ideHost}/?folder=/home/workspace/${repoName}&tkn=${OPENVSCODE_TOKEN}`;

      console.warn(`[WorkspaceManager] IDE URL: ${url}`);

      // Start Auto-Sync if requested
      if (options?.liveSync) {
        AutoSyncService.start(workspacePath, workspaceId);
      }

      return { url, port: 8080 };
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





