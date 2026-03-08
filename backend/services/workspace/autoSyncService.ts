import fs from "fs";
import path from "path";
import { simpleGit, SimpleGit } from "simple-git";

export class AutoSyncService {
    private static instances: Map<string, AutoSyncService> = new Map();
    private git: SimpleGit;
    private watcher: fs.FSWatcher | null = null;
    private debounceTimer: NodeJS.Timeout | null = null;
    private isSyncing = false;

    constructor(private workspacePath: string, private workspaceId: string) {
        this.git = simpleGit(workspacePath);
    }

    static start(workspacePath: string, workspaceId: string) {
        if (this.instances.has(workspaceId)) {
            console.warn(`[AutoSync] Service already running for workspace ${workspaceId}`);
            return;
        }

        const instance = new AutoSyncService(workspacePath, workspaceId);
        instance.setupWatcher();
        this.instances.set(workspaceId, instance);
        console.warn(`[AutoSync] Started for ${workspaceId} at ${workspacePath}`);
    }

    static stop(workspaceId: string) {
        const instance = this.instances.get(workspaceId);
        if (instance) {
            instance.cleanup();
            this.instances.delete(workspaceId);
            console.warn(`[AutoSync] Stopped for ${workspaceId}`);
        }
    }

    private setupWatcher() {
        try {
            this.watcher = fs.watch(this.workspacePath, { recursive: true }, (event, filename) => {
                if (filename && filename.startsWith(".git")) return;
                this.triggerSync();
            });
        } catch (err) {
            console.error(`[AutoSync] Failed to setup watcher for ${this.workspaceId}:`, err);
        }
    }

    private triggerSync() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(async () => {
            await this.sync();
        }, 5000); // 5 second debounce
    }

    private async sync() {
        if (this.isSyncing) {
            // Re-trigger after delay if already syncing
            this.triggerSync();
            return;
        }

        this.isSyncing = true;
        try {
            const status = await this.git.status();
            if (status.files.length > 0) {
                console.warn(`[AutoSync] Changes detected in ${this.workspaceId}, syncing...`);
                await this.git.add(".");
                await this.git.commit(`Auto-sync: ${new Date().toISOString()}`);

                // Check if remote exists before pushing
                const remotes = await this.git.getRemotes();
                if (remotes.length > 0) {
                    await this.git.push();
                    console.warn(`[AutoSync] Successfully pushed changes for ${this.workspaceId}`);
                } else {
                    console.warn(`[AutoSync] No remote configured for ${this.workspaceId}, skipping push`);
                }
            }
        } catch (err) {
            console.error(`[AutoSync] Sync failed for ${this.workspaceId}:`, err);
        } finally {
            this.isSyncing = false;
        }
    }

    private cleanup() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }
}





