import { prisma } from "../infra/prisma";
import { meilisearchClient } from "./meilisearch";

// Shared prisma instance

interface SearchResult {
  owners: Array<{
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    type: "user" | "organization";
  }>;
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    owner: string;
    description: string | null;
    visibility: string;
    stars: number;
    language: string | null;
  }>;
  recent: Array<{
    id: string;
    name: string;
    fullName: string;
    owner: string;
    lastVisited: Date;
  }>;
}

export const searchService = {
  /**
   * Global search across users and repositories using Meilisearch
   */
  async globalSearch(
    query: string,
    userId?: string,
    limit: number = 5,
  ): Promise<SearchResult> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      // Return recent repositories when query is empty
      const recent = userId
        ? await this.getRecentRepositories(userId, limit)
        : [];
      return {
        owners: [],
        repositories: [],
        recent,
      };
    }

    try {
      // Search users and repositories concurrently in Meilisearch
      const [ownersResult, reposResult] = await Promise.all([
        meilisearchClient.index('trackcodex.users').search(trimmedQuery, { limit }),
        meilisearchClient.index('trackcodex.repositories').search(trimmedQuery, { limit, filter: "visibility = 'public'" })
      ]);

      return {
        owners: ownersResult.hits.map((hit: any) => ({
          id: hit.id,
          username: hit.username || "",
          name: hit.name || "",
          avatar: hit.avatar,
          type: hit.role === "organization" ? "organization" : "user",
        })),
        repositories: reposResult.hits.map((hit: any) => ({
          id: hit.id,
          name: hit.name,
          fullName: `${hit.owner?.username || "unknown"}/${hit.name}`,
          owner: hit.owner?.username || "unknown",
          description: hit.description,
          visibility: hit.visibility || "public",
          stars: hit.stars || 0,
          language: hit.language,
        })),
        recent: [],
      };
    } catch (error) {
      console.error("[Meilisearch] Global search failed, falling back to empty:", error);
      return { owners: [], repositories: [], recent: [] };
    }
  },

  /**
   * Get user's recent repository visits
   */
  async getRecentRepositories(userId: string, limit: number = 5) {
    // Query user's repos ordered by most recently updated
    const repos = await prisma.repository.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        owner: {
          select: { username: true },
        },
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: `${repo.owner.username}/${repo.name}`,
      owner: repo.owner.username,
      lastVisited: repo.updatedAt,
    }));
  },

  /**
   * Track repository visit
   */
  async trackRepositoryVisit(userId: string, repositoryId: string) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          repoId: repositoryId,
          action: "view_repository",
          details: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error tracking repository visit:", error);
      // Don't throw - tracking failures shouldn't break navigation
    }
  },
};





