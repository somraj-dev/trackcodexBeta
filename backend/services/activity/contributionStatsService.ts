import { prisma } from "../infra/prisma";

// Shared prisma instance

interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4 for color intensity
}

export const contributionStatsService = {
  /**
   * Get contribution graph data for a given year
   * Aggregates from all TrackCodex development and community sources
   */
  async getContributionGraph(
    userId: string,
    year: number = new Date().getFullYear(),
  ): Promise<ContributionDay[]> {
    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;

    let startDate: Date;
    let endDate: Date;

    if (isCurrentYear) {
      // GitHub standard: Trailing 12 months (365 days)
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 364);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Fixed calendar year for historical data
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Comprehensive aggregation across all contribution models
    const [
      activities,
      workspaces,
      repositories,
      jobs,
      issues,
      pullRequests,
      discussions,
      discussionComments,
      reviews,
      deployments,
      posts,
      commComments,
      releases
    ] = await Promise.all([
      // 1. Generic Activity Logs (Commits, Pushes, etc.)
      prisma.activityLog.findMany({
        where: { 
          userId, 
          createdAt: { gte: startDate, lte: endDate }, 
          action: { in: ["commit", "push", "merge", "REPO_CREATE", "WORKSPACE_CREATE", "JOB_COMPLETED", "HACKATHON_WIN", "MISSION_SUCCESS"] } 
        },
        select: { createdAt: true },
      }),
      // 2. Workspaces (Owned)
      prisma.workspace.findMany({
        where: { ownerId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 3. Repositories (Owned)
      prisma.repository.findMany({
        where: { ownerId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 4. Job Applications
      prisma.jobApplication.findMany({
        where: { applicantId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 5. Issues (Authoring)
      prisma.issue.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 6. Pull Requests (Authoring)
      prisma.pullRequest.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 7. Discussions
      prisma.discussion.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 8. Discussion Comments
      prisma.discussionComment.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 9. PR Reviews
      prisma.pRReview.findMany({
        where: { reviewerId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 10. Project Deployments
      prisma.projectDeployment.findMany({
        where: { createdBy: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 11. Community Posts
      prisma.communityPost.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 12. Community Comments
      prisma.communityComment.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      }),
      // 13. Releases
      prisma.release.findMany({
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true },
      })
    ]);

    // Create a map of date -> count
    const activityMap = new Map<string, number>();
    
    // Helper to merge results into activityMap
    const mergeIntoMap = (items: any[]) => {
      items.forEach((item: any) => {
        if (!item.createdAt) return;
        const date = item.createdAt.toISOString().split("T")[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });
    };

    [
      activities, workspaces, repositories, jobs, 
      issues, pullRequests, discussions, discussionComments, 
      reviews, deployments, posts, commComments, releases
    ].forEach(set => mergeIntoMap(set));

    // Generate accurate range of days
    const contributions: ContributionDay[] = [];
    const iterDate = new Date(startDate);
    while (iterDate <= endDate) {
      const dateStr = iterDate.toISOString().split("T")[0];
      const count = activityMap.get(dateStr) || 0;

      // GitHub-style dynamic leveling
      let level = 0;
      if (count > 0) level = 1;
      if (count >= 4) level = 2; // Slightly higher thresholds for "Bigger than github"
      if (count >= 8) level = 3;
      if (count >= 15) level = 4;

      contributions.push({
        date: dateStr,
        count,
        level,
      });

      iterDate.setDate(iterDate.getDate() + 1);
    }

    return contributions;
  },

  /**
   * Calculate contribution streak across all TrackCodex models
   */
  async getStreak(
    userId: string,
  ): Promise<{ current: number; longest: number }> {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Get all activities for the last year to calculate current/longest streak
    const graph = await this.getContributionGraph(userId, today.getFullYear());
    
    // Convert to sorted array of dates with activity
    const activeDates = graph
      .filter(d => d.count > 0)
      .map(d => d.date)
      .sort()
      .reverse();

    if (activeDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // If active today or yesterday, streak is ongoing
    if (activeDates[0] === todayStr || activeDates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < activeDates.length; i++) {
        const prev = new Date(activeDates[i - 1]);
        const curr = new Date(activeDates[i]);
        const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);
        
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < activeDates.length; i++) {
      const prev = new Date(activeDates[i - 1]);
      const curr = new Date(activeDates[i]);
      const diff = Math.floor((prev.getTime() - curr.getTime()) / 86400000);

      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    return { current: currentStreak, longest: longestStreak };
  },

  /**
   * Get total contributions for a year across all models
   */
  async getTotalContributions(
    userId: string,
    year: number = new Date().getFullYear(),
  ): Promise<number> {
    const graph = await this.getContributionGraph(userId, year);
    return graph.reduce((sum, day) => sum + day.count, 0);
  },
};





