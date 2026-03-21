import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";

// Configure root storage path for Git repositories
export const GIT_ROOT = process.env.GIT_ROOT || path.join(process.cwd(), "data", "git");

export class GitStorageService {
    
    /**
     * Initializes a bare repository on disk.
     * @param ownerId - The ID of the owner.
     * @param repoName - The name of the repository.
     * @returns {Promise<string>} The absolute path to the bare repository.
     */
    static async initBareRepo(ownerId: string | number, repoName: string): Promise<string> {
        const repoPath = path.join(GIT_ROOT, String(ownerId), `${repoName}.git`);
        
        if (!existsSync(repoPath)) {
            // Create directory with 0755 permissions as required
            mkdirSync(repoPath, { recursive: true, mode: 0o755 });
        }
        
        const git = simpleGit(repoPath);
        await git.init(true); // true = bare init
        
        // Also initialize an empty commit so the main branch exists
        // We do this by cloning to a temp dir, making a readme, and pushing
        await this.createInitialCommit(repoPath, repoName);

        return repoPath;
    }

    private static async createInitialCommit(bareRepoPath: string, repoName: string) {
        const tempDir = path.join(os.tmpdir(), `trackcodex-init-${uuidv4()}`);
        await fs.mkdir(tempDir, { recursive: true });
        try {
            const git = simpleGit(tempDir);
            await git.clone(bareRepoPath, ".");
            
            const readmePath = path.join(tempDir, "README.md");
            await fs.writeFile(readmePath, `# ${repoName}\n\nInitialized via TrackCodex.`);
            
            await git.add("README.md");
            await git.commit("Initial commit");
            await git.push("origin", "master");
        } catch (e) {
            console.error("Failed to create initial commit:", e);
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }

    /**
     * Lists all branches in a repository.
     * @param repoPath - Path to the bare repository.
     * @returns {Promise<string[]>} Array of branch names.
     */
    static async listBranches(repoPath: string): Promise<string[]> {
        const git = simpleGit(repoPath);
        const branches = await git.branchLocal();
        return branches.all;
    }

    /**
     * Lists files recursively in a given branch as a JSON tree.
     * @param repoPath - Path to the bare repository.
     * @param branch - The branch to list files from.
     * @returns {Promise<any[]>} A JSON tree representing the files.
     */
    static async listFiles(repoPath: string, branch: string): Promise<any[]> {
        const isomorphicGit = require("isomorphic-git");
        const _fs = require("fs");
        
        try {
            const commitOid = await isomorphicGit.resolveRef({ fs: _fs, gitdir: repoPath, ref: branch });
            const { commit } = await isomorphicGit.readCommit({ fs: _fs, gitdir: repoPath, oid: commitOid });
            
            const walkTree = async (oid: string, currentPath: string = ''): Promise<any[]> => {
                const { tree } = await isomorphicGit.readTree({ fs: _fs, gitdir: repoPath, oid });
                let entries: any[] = [];
                for (const entry of tree) {
                    const entryPath = currentPath ? `${currentPath}/${entry.path}` : entry.path;
                    if (entry.type === 'tree') {
                        entries.push({
                            type: 'tree',
                            name: entry.path,
                            path: entryPath,
                            children: await walkTree(entry.oid, entryPath)
                        });
                    } else {
                        entries.push({
                            type: 'blob',
                            name: entry.path,
                            path: entryPath
                        });
                    }
                }
                return entries;
            };
            
            return await walkTree(commit.tree);
        } catch (err) {
            console.error("Error reading tree via isomorphic-git:", err);
            return [];
        }
    }

    /**
     * Gets the raw content of a file at a specific branch.
     * @param repoPath - Path to the bare repository.
     * @param branch - The branch name.
     * @param filePath - The file path inside the repo.
     * @returns {Promise<Buffer>} Buffer containing the file content.
     */
    static async getFileContent(repoPath: string, branch: string, filePath: string): Promise<Buffer> {
        const isomorphicGit = require("isomorphic-git");
        const _fs = require("fs");
        
        try {
            const commitOid = await isomorphicGit.resolveRef({ fs: _fs, gitdir: repoPath, ref: branch });
            const { commit } = await isomorphicGit.readCommit({ fs: _fs, gitdir: repoPath, oid: commitOid });
            
            const parts = filePath.split('/');
            let currentTreeOid = commit.tree;
            
            for (let i = 0; i < parts.length - 1; i++) {
                const { tree } = await isomorphicGit.readTree({ fs: _fs, gitdir: repoPath, oid: currentTreeOid });
                const entry = tree.find((e: any) => e.path === parts[i]);
                if (!entry || entry.type !== 'tree') throw new Error("Path not found");
                currentTreeOid = entry.oid;
            }
            
            const { tree } = await isomorphicGit.readTree({ fs: _fs, gitdir: repoPath, oid: currentTreeOid });
            const entry = tree.find((e: any) => e.path === parts[parts.length - 1]);
            if (!entry || entry.type !== 'blob') throw new Error("File not found");
            
            const { blob } = await isomorphicGit.readBlob({ fs: _fs, gitdir: repoPath, oid: entry.oid });
            return Buffer.from(blob);
        } catch (err) {
            throw new Error(`File not found or unreadable: ${filePath} at ${branch}`);
        }
    }

    /**
     * Compares two branches and returns a diff string.
     * @param repoPath - Path to the bare repository.
     * @param base - The base branch name.
     * @param head - The head branch name.
     * @returns {Promise<string>} Diff output as string.
     */
    static async compareBranches(repoPath: string, base: string, head: string): Promise<string> {
        const git = simpleGit(repoPath);
        try {
            return await git.diff([`${base}...${head}`]);
        } catch (err) {
            console.error("Error diffing branches", err);
            return "";
        }
    }

    /**
     * Merges a pull request using a temporary worktree/checkout.
     * @param repoPath - Path to the bare repository.
     * @param source - The source branch name.
     * @param target - The target branch name.
     * @param authorName - Name of the person merging.
     * @param authorEmail - Email of the person merging.
     * @returns {Promise<{ success: boolean; conflicts?: string[] }>} Status and conflicted paths.
     */
    static async mergePullRequest(
        repoPath: string, 
        source: string, 
        target: string, 
        authorName: string, 
        authorEmail: string
    ): Promise<{ success: boolean; conflicts?: string[] }> {
        
        // Use a temporary clone to perform the merge since bare repos can't easily handle conflicts natively
        const tempDir = path.join(os.tmpdir(), `trackcodex-merge-${uuidv4()}`);
        await fs.mkdir(tempDir, { recursive: true });
        
        try {
            const git = simpleGit(tempDir);
            await git.clone(repoPath, ".");
            
            // Setup identity
            await git.addConfig("user.name", authorName);
            await git.addConfig("user.email", authorEmail);
            
            // Checkout target branch
            await git.checkout(target);
            
            // Attempt to merge
            try {
                await git.merge([`origin/${source}`]);
            } catch (mergeErr: any) {
                // Determine conflicts
                const status = await git.status();
                if (status.conflicted.length > 0) {
                    return { success: false, conflicts: status.conflicted };
                }
                throw mergeErr;
            }
            
            // Push the merge result
            await git.push("origin", target);
            return { success: true };
            
        } catch (err) {
            console.error("Error merging pull request:", err);
            throw new Error("Merge failed due to internal error.");
        } finally {
            // Clean up temporary directory
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
}
