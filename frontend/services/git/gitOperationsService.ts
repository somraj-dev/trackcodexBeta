/**
 * TrackCodex Native Git Operations Frontend Service
 *
 * Calls TrackCodex's OWN backend for all Git operations.
 * This is the primary Git client — GitHub/GitLab are optional integrations.
 */
import { apiInstance } from "../infra/api";

// ─── Types ────────────────────────────────────────────────────

export interface CommitInfo {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  committer: { name: string; email: string; date: string };
  parents: string[];
}

export interface DiffEntry {
  file: string;
  status: string;
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

export interface RepoSummary {
  id: string;
  name: string;
  description?: string;
  git: {
    defaultBranch: string;
    branchCount: number;
    tagCount: number;
    lastCommit: CommitInfo | null;
  };
}

// ─── Service ──────────────────────────────────────────────────

const PREFIX = "/git-ops";

export const gitOpsService = {
  // ─── Commits ─────────────────────────────────────────────

  async getCommits(
    repoId: string,
    options?: { branch?: string; limit?: number; offset?: number }
  ): Promise<{ commits: CommitInfo[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.branch) params.set("branch", options.branch);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));

    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/commits?${params.toString()}`
    );
    return data;
  },

  async getCommit(
    repoId: string,
    sha: string
  ): Promise<{ commit: CommitInfo; diff: DiffResult }> {
    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/commits/${sha}`
    );
    return data;
  },

  async createCommit(
    repoId: string,
    branch: string,
    files: { path: string; content: string }[],
    message: string
  ): Promise<{ sha: string }> {
    const { data } = await apiInstance.post(
      `${PREFIX}/repos/${repoId}/commits`,
      { branch, files, message }
    );
    return data;
  },

  // ─── Diff ────────────────────────────────────────────────

  async getDiff(
    repoId: string,
    from: string,
    to?: string
  ): Promise<DiffResult> {
    const params = new URLSearchParams({ from });
    if (to) params.set("to", to);

    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/diff?${params.toString()}`
    );
    return data;
  },

  // ─── Branches ────────────────────────────────────────────

  async getBranches(repoId: string): Promise<{ branches: string[] }> {
    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/branches`
    );
    return data;
  },

  async createBranch(
    repoId: string,
    name: string,
    startPoint?: string
  ): Promise<{ branch: string }> {
    const { data } = await apiInstance.post(
      `${PREFIX}/repos/${repoId}/branches`,
      { name, startPoint }
    );
    return data;
  },

  async deleteBranch(repoId: string, name: string): Promise<void> {
    await apiInstance.delete(`${PREFIX}/repos/${repoId}/branches/${name}`);
  },

  // ─── Tags ────────────────────────────────────────────────

  async getTags(repoId: string): Promise<{ tags: string[] }> {
    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/tags`
    );
    return data;
  },

  async createTag(
    repoId: string,
    name: string,
    ref?: string,
    message?: string
  ): Promise<{ tag: string }> {
    const { data } = await apiInstance.post(
      `${PREFIX}/repos/${repoId}/tags`,
      { name, ref, message }
    );
    return data;
  },

  async deleteTag(repoId: string, name: string): Promise<void> {
    await apiInstance.delete(`${PREFIX}/repos/${repoId}/tags/${name}`);
  },

  // ─── Blame ───────────────────────────────────────────────

  async getBlame(
    repoId: string,
    filepath: string,
    ref?: string
  ): Promise<{ blame: BlameLine[] }> {
    const params = new URLSearchParams({ filepath });
    if (ref) params.set("ref", ref);

    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/blame?${params.toString()}`
    );
    return data;
  },

  // ─── Merge ───────────────────────────────────────────────

  async mergeBranches(
    repoId: string,
    source: string,
    target: string,
    message?: string
  ): Promise<{ success: boolean; sha?: string; conflicts?: string[] }> {
    const { data } = await apiInstance.post(
      `${PREFIX}/repos/${repoId}/merge`,
      { source, target, message }
    );
    return data;
  },

  // ─── Tree / Files ────────────────────────────────────────

  async getTree(
    repoId: string,
    ref?: string,
    dirPath?: string
  ): Promise<{ tree: TreeEntry[] }> {
    const params = new URLSearchParams();
    if (ref) params.set("ref", ref);
    if (dirPath) params.set("path", dirPath);

    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/tree?${params.toString()}`
    );
    return data;
  },

  async getFileContent(
    repoId: string,
    filepath: string,
    ref?: string
  ): Promise<{ filepath: string; ref: string; content: string }> {
    const params = new URLSearchParams({ filepath });
    if (ref) params.set("ref", ref);

    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/file?${params.toString()}`
    );
    return data;
  },

  // ─── Repo Summary ───────────────────────────────────────

  async getRepoSummary(repoId: string): Promise<RepoSummary> {
    const { data } = await apiInstance.get(
      `${PREFIX}/repos/${repoId}/summary`
    );
    return data;
  },
};
