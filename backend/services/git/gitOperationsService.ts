import { GitServer } from "./gitServer";
import path from "path";
import fs from "fs";

/**
 * TrackCodex Native Git Operations Service
 * 
 * Powers ALL core Git operations on TrackCodex's own bare repositories.
 * Zero dependency on GitHub/GitLab — this IS TrackCodex's Git engine.
 * 
 * Uses: isomorphic-git + native git CLI via GitServer.spawnGit()
 */

const gitServer = new GitServer();

export interface CommitInfo {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  committer: { name: string; email: string; date: string };
  parents: string[];
}

export interface DiffEntry {
  file: string;
  status: string; // A(dded), M(odified), D(eleted), R(enamed)
  additions: number;
  deletions: number;
  patch?: string;
}

export interface DiffResult {
  from: string;
  to: string;
  stats: { filesChanged: number; additions: number; deletions: number };
  files: DiffEntry[];
  rawPatch: string;
}

export interface BlameLine {
  sha: string;
  author: string;
  date: string;
  lineNumber: number;
  content: string;
}

export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  mode: string;
  sha: string;
}

export class GitOperationsService {
  // ─── COMMIT OPERATIONS ───────────────────────────────────────

  /**
   * Get commit history for a branch or ref.
   */
  static async getCommits(
    repoId: string,
    options: { branch?: string; limit?: number; offset?: number } = {}
  ): Promise<CommitInfo[]> {
    const repoPath = gitServer.getRepoPath(repoId);
    const ref = options.branch || "HEAD";
    const limit = options.limit || 30;
    const offset = options.offset || 0;

    // git log --format with structured output
    const format = "%H%n%s%n%an%n%ae%n%ai%n%cn%n%ce%n%ci%n%P%n---END---";
    const args = [
      "log", ref,
      `--format=${format}`,
      `--skip=${offset}`,
      `-n`, `${limit}`,
    ];

    try {
      const output = await gitServer.spawnGit(args, repoPath);
      return this.parseCommitLog(output);
    } catch (e) {
      console.error(`[GitOps] Failed to get commits for ${repoId}:`, e);
      return [];
    }
  }

  /**
   * Get details for a single commit.
   */
  static async getCommit(repoId: string, sha: string): Promise<CommitInfo | null> {
    const repoPath = gitServer.getRepoPath(repoId);
    const format = "%H%n%s%n%an%n%ae%n%ai%n%cn%n%ce%n%ci%n%P%n---END---";

    try {
      const output = await gitServer.spawnGit(
        ["log", "-1", `--format=${format}`, sha],
        repoPath
      );
      const commits = this.parseCommitLog(output);
      return commits[0] || null;
    } catch (e) {
      console.error(`[GitOps] Failed to get commit ${sha}:`, e);
      return null;
    }
  }

  /**
   * Create a commit via the web editor (for bare repos).
   * Uses a temporary worktree to stage files and commit.
   */
  static async createCommit(
    repoId: string,
    branch: string,
    files: { path: string; content: string }[],
    message: string,
    author: { name: string; email: string }
  ): Promise<{ sha: string } | null> {
    const repoPath = gitServer.getRepoPath(repoId);
    const tmpDir = path.join(process.cwd(), "tmp", `commit-${Date.now()}`);

    try {
      // 1. Clone bare repo into a temp working copy
      fs.mkdirSync(tmpDir, { recursive: true });
      await gitServer.spawnGit(["clone", repoPath, tmpDir], process.cwd());

      // 2. Checkout target branch
      try {
        await gitServer.spawnGit(["checkout", branch], tmpDir);
      } catch {
        // Branch doesn't exist, create it
        await gitServer.spawnGit(["checkout", "-b", branch], tmpDir);
      }

      // 3. Write files
      for (const file of files) {
        const filePath = path.join(tmpDir, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, "utf-8");
      }

      // 4. Stage and commit
      await gitServer.spawnGit(["add", "-A"], tmpDir);
      await gitServer.spawnGit(
        [
          "-c", `user.name=${author.name}`,
          "-c", `user.email=${author.email}`,
          "commit", "-m", message,
        ],
        tmpDir
      );

      // 5. Push back to bare repo
      await gitServer.spawnGit(["push", "origin", branch], tmpDir);

      // 6. Get the new commit SHA
      const sha = (await gitServer.spawnGit(["rev-parse", "HEAD"], tmpDir)).trim();

      return { sha };
    } catch (e) {
      console.error(`[GitOps] Failed to create commit:`, e);
      return null;
    } finally {
      // Cleanup temp dir
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch { /* ignore cleanup errors */ }
    }
  }

  // ─── DIFF OPERATIONS ────────────────────────────────────────

  /**
   * Get diff between two refs, or show a single commit's diff.
   */
  static async getDiff(
    repoId: string,
    fromRef: string,
    toRef?: string
  ): Promise<DiffResult> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      // If only fromRef, show that commit's diff
      const diffArgs = toRef
        ? ["diff", "--numstat", fromRef, toRef]
        : ["diff-tree", "--numstat", "-r", fromRef];

      const patchArgs = toRef
        ? ["diff", fromRef, toRef]
        : ["diff-tree", "-p", "-r", fromRef];

      const [numstatOutput, patchOutput] = await Promise.all([
        gitServer.spawnGit(diffArgs, repoPath),
        gitServer.spawnGit(patchArgs, repoPath),
      ]);

      const files = this.parseNumstat(numstatOutput);
      const stats = files.reduce(
        (acc, f) => ({
          filesChanged: acc.filesChanged + 1,
          additions: acc.additions + f.additions,
          deletions: acc.deletions + f.deletions,
        }),
        { filesChanged: 0, additions: 0, deletions: 0 }
      );

      return {
        from: fromRef,
        to: toRef || `${fromRef}~1`,
        stats,
        files,
        rawPatch: patchOutput,
      };
    } catch (e) {
      console.error(`[GitOps] Failed to get diff:`, e);
      return {
        from: fromRef,
        to: toRef || "",
        stats: { filesChanged: 0, additions: 0, deletions: 0 },
        files: [],
        rawPatch: "",
      };
    }
  }

  // ─── BRANCH OPERATIONS ──────────────────────────────────────

  /**
   * List all branches in a repository.
   */
  static async getBranches(repoId: string): Promise<string[]> {
    return gitServer.listBranches(repoId);
  }

  /**
   * Create a new branch from a starting point.
   */
  static async createBranch(
    repoId: string,
    name: string,
    startPoint: string = "HEAD"
  ): Promise<{ success: boolean; error?: string }> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      await gitServer.spawnGit(["branch", name, startPoint], repoPath);
      return { success: true };
    } catch (e: any) {
      console.error(`[GitOps] Failed to create branch ${name}:`, e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Delete a branch.
   */
  static async deleteBranch(
    repoId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      await gitServer.spawnGit(["branch", "-D", name], repoPath);
      return { success: true };
    } catch (e: any) {
      console.error(`[GitOps] Failed to delete branch ${name}:`, e);
      return { success: false, error: e.message };
    }
  }

  // ─── TAG OPERATIONS ─────────────────────────────────────────

  /**
   * List all tags in a repository.
   */
  static async getTags(repoId: string): Promise<string[]> {
    return gitServer.listTags(repoId);
  }

  /**
   * Create a tag (lightweight or annotated).
   */
  static async createTag(
    repoId: string,
    name: string,
    ref: string = "HEAD",
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      if (message) {
        // Annotated tag
        await gitServer.spawnGit(["tag", "-a", name, ref, "-m", message], repoPath);
      } else {
        // Lightweight tag
        await gitServer.spawnGit(["tag", name, ref], repoPath);
      }
      return { success: true };
    } catch (e: any) {
      console.error(`[GitOps] Failed to create tag ${name}:`, e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Delete a tag.
   */
  static async deleteTag(
    repoId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      await gitServer.spawnGit(["tag", "-d", name], repoPath);
      return { success: true };
    } catch (e: any) {
      console.error(`[GitOps] Failed to delete tag ${name}:`, e);
      return { success: false, error: e.message };
    }
  }

  // ─── BLAME ──────────────────────────────────────────────────

  /**
   * Get blame information for a file.
   */
  static async getBlame(
    repoId: string,
    filepath: string,
    ref: string = "HEAD"
  ): Promise<BlameLine[]> {
    const repoPath = gitServer.getRepoPath(repoId);

    try {
      // --porcelain gives machine-readable output
      const output = await gitServer.spawnGit(
        ["blame", "--porcelain", ref, "--", filepath],
        repoPath
      );
      return this.parseBlame(output);
    } catch (e) {
      console.error(`[GitOps] Failed to get blame for ${filepath}:`, e);
      return [];
    }
  }

  // ─── MERGE ──────────────────────────────────────────────────

  /**
   * Merge source branch into target branch.
   * Uses a temporary worktree for bare repo merges.
   */
  static async merge(
    repoId: string,
    source: string,
    target: string,
    message?: string
  ): Promise<{ success: boolean; sha?: string; error?: string; conflicts?: string[] }> {
    const repoPath = gitServer.getRepoPath(repoId);
    const tmpDir = path.join(process.cwd(), "tmp", `merge-${Date.now()}`);

    try {
      // Clone, checkout target, merge source
      fs.mkdirSync(tmpDir, { recursive: true });
      await gitServer.spawnGit(["clone", repoPath, tmpDir], process.cwd());
      await gitServer.spawnGit(["checkout", target], tmpDir);

      try {
        const mergeMsg = message || `Merge branch '${source}' into ${target}`;
        await gitServer.spawnGit(["merge", source, "-m", mergeMsg], tmpDir);
      } catch (mergeErr: any) {
        // Check for conflicts
        const statusOutput = await gitServer.spawnGit(["diff", "--name-only", "--diff-filter=U"], tmpDir);
        const conflicts = statusOutput.trim().split("\n").filter(Boolean);
        // Abort the merge
        await gitServer.spawnGit(["merge", "--abort"], tmpDir);
        return { success: false, conflicts, error: "Merge conflicts detected" };
      }

      // Push merged result
      await gitServer.spawnGit(["push", "origin", target], tmpDir);
      const sha = (await gitServer.spawnGit(["rev-parse", "HEAD"], tmpDir)).trim();

      return { success: true, sha };
    } catch (e: any) {
      console.error(`[GitOps] Merge failed:`, e);
      return { success: false, error: e.message };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch { /* ignore cleanup errors */ }
    }
  }

  // ─── TREE BROWSING ──────────────────────────────────────────

  /**
   * Browse files/folders at a path in a repo (wraps GitServer.lsTree).
   */
  static async getTree(
    repoId: string,
    ref: string = "HEAD",
    dirPath: string = ""
  ): Promise<TreeEntry[]> {
    return (await gitServer.lsTree(repoId, ref, dirPath)) as TreeEntry[];
  }

  /**
   * Get file content at a specific ref and path.
   */
  static async getFileContent(
    repoId: string,
    ref: string,
    filepath: string
  ): Promise<string | null> {
    const content = await gitServer.getFileContentByPath(repoId, ref, filepath);
    if (content === null) return null;
    return typeof content === "string" ? content : JSON.stringify(content);
  }

  // ─── REPO INFO ──────────────────────────────────────────────

  /**
   * Get summary info for a repository (HEAD commit, branch count, etc.)
   */
  static async getRepoSummary(repoId: string): Promise<{
    defaultBranch: string;
    branchCount: number;
    tagCount: number;
    lastCommit: CommitInfo | null;
  }> {
    const [branches, tags, lastCommit] = await Promise.all([
      this.getBranches(repoId),
      this.getTags(repoId),
      this.getCommits(repoId, { limit: 1 }),
    ]);

    // Determine default branch
    const defaultBranch = branches.includes("main")
      ? "main"
      : branches.includes("master")
        ? "master"
        : branches[0] || "main";

    return {
      defaultBranch,
      branchCount: branches.length,
      tagCount: tags.length,
      lastCommit: lastCommit[0] || null,
    };
  }

  // ─── PRIVATE PARSERS ───────────────────────────────────────

  private static parseCommitLog(output: string): CommitInfo[] {
    const commits: CommitInfo[] = [];
    const blocks = output.split("---END---").filter((b) => b.trim());

    for (const block of blocks) {
      const lines = block.trim().split("\n");
      if (lines.length < 8) continue;

      commits.push({
        sha: lines[0],
        message: lines[1],
        author: { name: lines[2], email: lines[3], date: lines[4] },
        committer: { name: lines[5], email: lines[6], date: lines[7] },
        parents: lines[8] ? lines[8].split(" ").filter(Boolean) : [],
      });
    }

    return commits;
  }

  private static parseNumstat(output: string): DiffEntry[] {
    return output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("\t");
        if (parts.length < 3) return null;

        const [adds, dels, file] = parts;
        return {
          file,
          status: "M",
          additions: adds === "-" ? 0 : parseInt(adds, 10),
          deletions: dels === "-" ? 0 : parseInt(dels, 10),
        };
      })
      .filter(Boolean) as DiffEntry[];
  }

  private static parseBlame(output: string): BlameLine[] {
    const lines: BlameLine[] = [];
    const rawLines = output.split("\n");

    let currentSha = "";
    let currentAuthor = "";
    let currentDate = "";
    let currentLineNum = 0;

    for (const raw of rawLines) {
      // Header line: <sha> <orig-line> <final-line> [<num-lines>]
      const headerMatch = raw.match(/^([0-9a-f]{40})\s+(\d+)\s+(\d+)/);
      if (headerMatch) {
        currentSha = headerMatch[1];
        currentLineNum = parseInt(headerMatch[3], 10);
        continue;
      }

      if (raw.startsWith("author ")) {
        currentAuthor = raw.slice(7);
      } else if (raw.startsWith("author-time ")) {
        const timestamp = parseInt(raw.slice(12), 10);
        currentDate = new Date(timestamp * 1000).toISOString();
      } else if (raw.startsWith("\t")) {
        // Content line
        lines.push({
          sha: currentSha,
          author: currentAuthor,
          date: currentDate,
          lineNumber: currentLineNum,
          content: raw.slice(1),
        });
      }
    }

    return lines;
  }
}
