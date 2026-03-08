import { prisma } from "../infra/prisma";
import { GitServer } from "./gitServer";

// Shared prisma instance
const gitServer = new GitServer();

export interface SCMRepository {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  techStack: string;
  techColor: string;
  lastUpdated: string;
}

/**
 * TrackCodex Native SCM Service
 * Handles repository lifecycle directly on the host or container filesystem.
 */
export class SCMService {
  /**
   * Provisions a new native git repository.
   */
  static async createRepository(data: {
    id: string;
    name: string;
    description?: string;
    techStack?: string;
  }): Promise<SCMRepository> {
    console.log(`🚀 SCM [Native]: Provisioning repository ${data.name}...`);

    // Initialize the bare repository locally
    const success = await gitServer.ensureRepoExists(data.id);
    if (!success) {
      throw new Error("Failed to initialize physical git repository");
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      stars: 0,
      forks: 0,
      techStack: data.techStack || "TypeScript",
      techColor: "#3178c6",
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get local file system path for a repository.
   */
  static async getRepoPath(repoId: string): Promise<string> {
    return gitServer.getRepoPath(repoId);
  }

  /**
   * Imports an external repository via clone.
   */
  static async importRepository(data: {
    id: string;
    sourceUrl: string;
    sourceUsername?: string;
    sourceToken?: string;
  }): Promise<boolean> {
    console.log(`📡 SCM [Native]: Importing repository from ${data.sourceUrl}...`);

    const repoPath = gitServer.getRepoPath(data.id);

    // Construct authenticated URL if credentials provided
    let cloneUrl = data.sourceUrl;
    if (data.sourceUsername && data.sourceToken) {
      try {
        const url = new URL(data.sourceUrl);
        url.username = data.sourceUsername;
        url.password = data.sourceToken;
        cloneUrl = url.toString();
      } catch (e) {
        console.warn("Invalid source URL for credential injection, using raw URL");
      }
    }

    try {
      // Run git clone --bare <url> <path>
      await gitServer.spawnGit(["clone", "--bare", cloneUrl, repoPath], process.cwd());
      console.log(`✅ SCM [Native]: Successfully imported to ${repoPath}`);
      return true;
    } catch (e) {
      console.error("❌ SCM [Native]: Import failed", e);
      return false;
    }
  }

  /**
   * Sync logic for Pull Requests (now powered by native git state)
   */
  static async syncPullRequests(repoId: string) {
    console.log(`📡 SCM [Native]: Synchronizing PRs for ${repoId}...`);
    // Future: Use isomorphic-git to parse refs/pull/* and update local PR records
    return await prisma.pullRequest.findMany({ where: { repoId } });
  }

  /**
   * Sync logic for Issues
   */
  static async syncIssues(repoId: string) {
    console.log(`📡 SCM [Native]: Synchronizing Issues for ${repoId}...`);
    return await prisma.issue.findMany({ where: { repoId } });
  }
}





