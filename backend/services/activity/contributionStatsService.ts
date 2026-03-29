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
      prisma.activityLog.groupBy({
        by: ["createdAt"],
        where: { userId, createdAt: { gte: startDate, lte: endDate }, action: { in: ["commit", "push", "merge", "JOB_COMPLETED", "HACKATHON_WIN", "MISSION_SUCCESS"] } },
        _count: { id: true },
      }),
      // 2. Workspaces
      prisma.workspace.groupBy({
        by: ["createdAt"],
        where: { ownerId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 3. Repositories
      prisma.repository.groupBy({
        by: ["createdAt"],
        where: { ownerId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 4. Job Applications
      prisma.jobApplication.groupBy({
        by: ["createdAt"],
        where: { applicantId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 5. Issues (Authoring)
      prisma.issue.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 6. Pull Requests (Authoring)
      prisma.pullRequest.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 7. Discussions
      prisma.discussion.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 8. Discussion Comments
      prisma.discussionComment.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 9. PR Reviews
      prisma.pRReview.groupBy({
        by: ["createdAt"],
        where: { reviewerId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 10. Project Deployments
      prisma.projectDeployment.groupBy({
        by: ["createdAt"],
        where: { createdBy: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 11. Community Posts
      prisma.communityPost.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 12. Community Comments
      prisma.communityComment.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      // 13. Releases
      prisma.release.groupBy({
        by: ["createdAt"],
        where: { authorId: userId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      })
    ]);

    // Create a map of date -> count
    const activityMap = new Map<string, number>();
    
    // Helper to merge results into activityMap
    const mergeIntoMap = (items: any[]) => {
      items.forEach((item: any) => {
        const date = item.createdAt.toISOString().split("T")[0];
        activityMap.set(date, (activityMap.get(date) || 0) + (item._count.id || item._count.userId || 1));
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





