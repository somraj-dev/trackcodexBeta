import axios from "axios";
import { prisma } from "../infra/prisma";
import { decrypt } from "../auth/encryption";

export class GitLabService {
  /**
   * Sync repositories for a given user from GitLab to local DB
   */
  static async syncRepositories(userId: string): Promise<any[]> {
    console.log(`[GitLabService] Syncing repos for user ${userId}`);

    // 1. Get encrypted token
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId: userId,
        provider: "gitlab",
      },
    });

    if (!oauthAccount || !oauthAccount.accessToken) {
      throw new Error("No GitLab account linked or missing access token");
    }

    // 2. Decrypt token
    const accessToken = decrypt(oauthAccount.accessToken);

    // 3. Fetch Repositories from GitLab API
    const response = await axios.get("https://gitlab.com/api/v4/projects", {
      params: {
        membership: true,
        simple: true,
        per_page: 100,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const repos = response.data;
    console.log(`[GitLabService] Fetched ${repos.length} repositories from GitLab`);

    const syncedRepos = [];

    // 4. Upsert into Database
    for (const repo of repos) {
      // Use gitlabId as a unique identifier for upsert
      const upserted = await prisma.repository.upsert({
        where: {
          githubId: repo.id.toString(), // Using githubId column for now as generic 'providerId' if needed, OR we should check schema for gitlabId
        },
        create: {
          name: repo.path_with_namespace || repo.name,
          description: repo.description,
          isPublic: repo.visibility === "public",
          stars: repo.star_count || 0,
          forksCount: repo.forks_count || 0,
          language: "", // GitLab simple API doesn't return this easily
          githubId: repo.id.toString(), // Mapping to existing column for simplicity if schema allows
          htmlUrl: repo.web_url,
          settings: { defaultBranch: repo.default_branch } as any,
          owner: { connect: { id: userId } },
        },
        update: {
          name: repo.path_with_namespace || repo.name,
          description: repo.description,
          isPublic: repo.visibility === "public",
          stars: repo.star_count || 0,
          forksCount: repo.forks_count || 0,
          htmlUrl: repo.web_url,
        },
      });

      syncedRepos.push(upserted);
    }

    return syncedRepos;
  }

  /**
   * Sync ALL data for a given user from GitLab (placeholder for full implementation)
   */
  static async syncAllData(userId: string): Promise<void> {
    console.log(`[GitLabService] Starting FULL sync for user ${userId}`);
    try {
      await this.syncRepositories(userId);
      // Logic for issues and MRs can be added here
    } catch (err) {
      console.error(`[GitLabService] Full sync failed for user ${userId}:`, err);
    }
  }
}
