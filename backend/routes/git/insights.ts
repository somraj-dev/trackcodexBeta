import { FastifyInstance } from "fastify";
import { GitServer } from "../../services/git/gitServer";
import { requireRepoPermission, RepoLevel } from "../../middleware/repoAuth";
import { prisma } from "../../services/infra/prisma";

export async function insightsRoutes(fastify: FastifyInstance) {
  // GET /repositories/:id/insights/pulse
  fastify.get(
    "/repositories/:id/insights/pulse",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request, reply) => {
      const { id: repoId } = request.params as { id: string };
      const { period = "week" } = request.query as { period?: string };

      try {
        const gitServer = new GitServer();
        const repoPath = gitServer.getRepoPath(repoId);

        // Get commits based on period
        let since = "7 days ago";
        let sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 7);

        if (period === "day") {
          since = "24 hours ago";
          sinceDate = new Date();
          sinceDate.setHours(sinceDate.getHours() - 24);
        }
        if (period === "month") {
          since = "1 month ago";
          sinceDate = new Date();
          sinceDate.setMonth(sinceDate.getMonth() - 1);
        }

        // Fetch commits
        // git log --since="7 days ago" --pretty=format:"%h|%an|%s"
        const logOutput = await gitServer.spawnGit(
          ["log", `--since=${since}`, "--pretty=format:%h|%an|%s"],
          repoPath,
        );

        const commits = logOutput
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [sha, author, message] = line.split("|");
            return { sha, author, message };
          });

        // Fetch Real PR and Issue Stats from DB
        const [mergedPRs, openPRs, closedIssues, newIssues] = await Promise.all(
          [
            prisma.pullRequest.count({
              where: {
                repoId,
                status: "MERGED",
                updatedAt: { gte: sinceDate },
              },
            }),
            prisma.pullRequest.count({
              where: { repoId, status: "OPEN" },
            }),
            prisma.issue.count({
              where: {
                repoId,
                status: "CLOSED",
                updatedAt: { gte: sinceDate },
              },
            }),
            prisma.issue.count({
              where: {
                repoId,
                createdAt: { gte: sinceDate },
              },
            }),
          ],
        );

        return {
          activePullRequests: {
            merged: mergedPRs,
            open: openPRs,
          },
          activeIssues: {
            closed: closedIssues,
            new: newIssues,
          },
          commits: {
            total: commits.length,
            authors: [...new Set(commits.map((c) => c.author))].length,
          },
        };
      } catch (e: any) {
        request.log.error(e);
        return reply.code(500).send({ error: "Failed to fetch pulse data" });
      }
    },
  );

  // GET /repositories/:id/insights/contributors
  fastify.get(
    "/repositories/:id/insights/contributors",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request) => {
      const { id: repoId } = request.params as { id: string };

      try {
        const gitServer = new GitServer();
        const repoPath = gitServer.getRepoPath(repoId);

        // git shortlog -sne --all
        const output = await gitServer.spawnGit(["shortlog", "-sne", "--all"], repoPath);
        
        const contributors = output.split("\n").filter(Boolean).map(line => {
          const match = line.match(/^\s*(\d+)\s+(.+)\s+<(.+)>$/);
          if (match) {
            return {
              commits: parseInt(match[1]),
              name: match[2],
              email: match[3],
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(match[2])}&background=random`
            };
          }
          return null;
        }).filter(Boolean);

        return contributors;
      } catch (e: any) {
        request.log.error(e);
        return [];
      }
    }
  );

  // GET /repositories/:id/insights/commits
  fastify.get(
    "/repositories/:id/insights/commits",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request) => {
      const { id: repoId } = request.params as { id: string };

      try {
        const gitServer = new GitServer();
        const repoPath = gitServer.getRepoPath(repoId);

        // git log --pretty=format:"%ad" --date=short
        const output = await gitServer.spawnGit(["log", "--pretty=format:%ad", "--date=short"], repoPath);
        
        const dates = output.split("\n").filter(Boolean);
        const counts: Record<string, number> = {};
        
        dates.forEach(date => {
          counts[date] = (counts[date] || 0) + 1;
        });

        const timeline = Object.entries(counts).map(([date, count]) => ({
          date,
          commits: count
        })).sort((a,b) => a.date.localeCompare(b.date));

        return timeline;
      } catch (e: any) {
        request.log.error(e);
        return [];
      }
    }
  );

  // GET /repositories/:id/insights/code-frequency
  fastify.get(
    "/repositories/:id/insights/code-frequency",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request) => {
      const { id: repoId } = request.params as { id: string };

      try {
        const gitServer = new GitServer();
        const repoPath = gitServer.getRepoPath(repoId);

        // git log --pretty=format:"DATE:%ad" --date=short --numstat
        const output = await gitServer.spawnGit(["log", "--pretty=format:DATE:%ad", "--date=short", "--numstat"], repoPath);
        
        const lines = output.split("\n");
        const timeline: Record<string, { additions: number; deletions: number }> = {};
        let currentDate = "";

        lines.forEach(line => {
          if (line.startsWith("DATE:")) {
            currentDate = line.replace("DATE:", "");
            if (!timeline[currentDate]) timeline[currentDate] = { additions: 0, deletions: 0 };
          } else if (line.trim()) {
            const [add, del] = line.split("\t");
            if (!isNaN(parseInt(add)) && !isNaN(parseInt(del))) {
              timeline[currentDate].additions += parseInt(add);
              timeline[currentDate].deletions += parseInt(del);
            }
          }
        });

        return Object.entries(timeline).map(([date, stats]) => ({
          date,
          ...stats
        })).sort((a,b) => a.date.localeCompare(b.date));
      } catch (e: any) {
        request.log.error(e);
        return [];
      }
    }
  );

  // GET /repositories/:id/insights/forks
  fastify.get(
    "/repositories/:id/insights/forks",
    { preHandler: requireRepoPermission(RepoLevel.READ) },
    async (request) => {
      const { id } = request.params as { id: string };
      
      const forks = await prisma.repository.findMany({
        where: { forkedFromId: id },
        include: { owner: { select: { id: true, username: true, avatar: true } } }
      });
      
      return forks;
    }
  );
}




