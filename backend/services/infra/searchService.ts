import { prisma } from "./prisma";

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
   * Global search across users and repositories
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

    // Search users/organizations
    const owners = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: trimmedQuery, mode: "insensitive" } },
          { name: { contains: trimmedQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
      },
      take: limit,
    });

    // Search repositories
    const repositories = await prisma.repository.findMany({
      where: {
        OR: [
          { name: { contains: trimmedQuery, mode: "insensitive" } },
          { description: { contains: trimmedQuery, mode: "insensitive" } },
        ],
        visibility: "public", // Only public repos in global search
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        stars: true,
        language: true,
        owner: {
          select: {
            username: true,
          },
        },
      },
      take: limit,
      orderBy: {
        stars: "desc",
      },
    });

    return {
      owners: owners.map((user) => ({
        id: user.id,
        username: user.username || "",
        name: user.name || "",
        avatar: user.avatar,
        type: user.role === "organization" ? "organization" : "user",
      })),
      repositories: repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: `${repo.owner?.username || "unknown"}/${repo.name}`,
        owner: repo.owner?.username || "unknown",
        description: repo.description,
        visibility: repo.visibility,
        stars: repo.stars,
        language: repo.language,
      })),
      recent: [],
    };
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
