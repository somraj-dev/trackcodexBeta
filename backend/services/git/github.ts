import { Octokit } from "@octokit/rest";
import { prisma } from "../infra/prisma";
import { decrypt } from "../auth/encryption";

// Shared prisma instance

export class GitHubService {
  /**
   * Sync repositories for a given user from GitHub to local DB
   */
  static async syncRepositories(userId: string): Promise<any[]> {
    console.log(`[GitHubService] Syncing repos for user ${userId}`);

    // 1. Get encrypted token
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId: userId,
        provider: "github",
      },
    });

    if (!oauthAccount || !oauthAccount.accessToken) {
      throw new Error("No GitHub account linked or missing access token");
    }

    // 2. Decrypt token
    const accessToken = decrypt(oauthAccount.accessToken);

    // 3. Initialize Octokit
    const octokit = new Octokit({
      auth: accessToken,
    });

    // 4. Fetch Repositories (Fetch user's own repos + org repos they have access to)
    // Using per_page 100 to get a good chunk. Pagination can be added later.
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      visibility: "all",
      sort: "updated",
      per_page: 100,
    });

    console.log(
      `[GitHubService] Fetched ${repos.length} repositories from GitHub`,
    );

    const syncedRepos = [];

    // 5. Upsert into Database using githubId as the unique key
    for (const repo of repos) {
      if (repo.archived) continue;

      const upserted = await prisma.repository.upsert({
        where: {
          githubId: repo.id.toString(),
        },
        create: {
          name: repo.name,
          description: repo.description,
          isPublic: !repo.private,
          stars: repo.stargazers_count,
          forksCount: repo.forks_count,
          language: repo.language,
          githubId: repo.id.toString(),
          htmlUrl: repo.html_url,
          settings: { defaultBranch: repo.default_branch } as any,
          owner: { connect: { id: userId } },
          updatedAt: new Date(repo.updated_at || Date.now()),
        },
        update: {
          name: repo.name,
          description: repo.description,
          isPublic: !repo.private,
          stars: repo.stargazers_count,
          forksCount: repo.forks_count,
          language: repo.language,
          htmlUrl: repo.html_url,
          updatedAt: new Date(repo.updated_at || Date.now()),
        },
      });

      syncedRepos.push(upserted);
    }

    // Note: The above upsert on 'id' works if we knew the ID.
    // Since we don't, we should rely on 'githubId' being unique.
    // However, the schema shows githubId is @unique field now!
    // So we can use upsert using githubId.

    return syncedRepos;
  }

  /**
   * Sync ALL data for a given user from GitHub to local DB
   * This includes Repositories, Issues, Pull Requests, and CI Workflows.
   */
  static async syncAllData(userId: string): Promise<void> {
    console.log(`[GitHubService] Starting FULL sync for user ${userId}`);
    const octokit = await this.getOctokit(userId);

    // 1. Sync Repositories first
    const repos = await this.syncRepositories(userId);

    for (const repo of repos) {
      if (!repo.githubId) continue;
      const [owner, name] = repo.htmlUrl.split("/").slice(-2);

      try {
        // 2. Sync Issues
        const issues = await this.listIssues(userId, owner, name, "all");
        for (const issueData of issues) {
          await prisma.issue.upsert({
            where: {
              repoId_number: {
                repoId: repo.id,
                number: issueData.number,
              },
            },
            create: {
              repoId: repo.id,
              number: issueData.number,
              title: issueData.title,
              body: issueData.body,
              status: issueData.state.toUpperCase(),
              authorId: userId, // Mapping simplified
              createdAt: new Date(issueData.created_at),
              updatedAt: new Date(issueData.updated_at),
            },
            update: {
              title: issueData.title,
              body: issueData.body,
              status: issueData.state.toUpperCase(),
              updatedAt: new Date(issueData.updated_at),
            },
          });
        }

        // 3. Sync Pull Requests
        const prs = await this.listPullRequests(userId, owner, name, "all");
        for (const prData of prs) {
          await prisma.pullRequest.upsert({
            where: {
              repoId_number: {
                repoId: repo.id,
                number: prData.number,
              },
            },
            create: {
              repoId: repo.id,
              number: prData.number,
              title: prData.title,
              body: prData.body,
              status: prData.state.toUpperCase(),
              base: prData.base.ref,
              head: prData.head.ref,
              authorId: userId,
              createdAt: new Date(prData.created_at),
              updatedAt: new Date(prData.updated_at),
            },
            update: {
              title: prData.title,
              body: prData.body,
              status: prData.state.toUpperCase(),
              updatedAt: new Date(prData.updated_at),
            },
          });
        }

        // 4. Sync Workflows & Runs
        const { data: workflowsData } = await octokit.actions.listRepoWorkflows({
          owner,
          repo: name,
        });

        for (const wf of workflowsData.workflows) {
          const workflow = await prisma.workflow.upsert({
            where: {
              repoId_path: {
                repoId: repo.id,
                path: wf.path,
              },
            },
            create: {
              repoId: repo.id,
              name: wf.name,
              path: wf.path,
              state: wf.state === "active" ? "ACTIVE" : "DISABLED",
            },
            update: {
              name: wf.name,
              state: wf.state === "active" ? "ACTIVE" : "DISABLED",
            },
          });

          // Sync Runs for this workflow
          const { data: runsData } = await octokit.actions.listWorkflowRuns({
            owner,
            repo: name,
            workflow_id: wf.id,
            per_page: 5,
          });

          for (const run of runsData.workflow_runs) {
            await prisma.workflowRun.upsert({
              where: { id: run.id.toString() },
              create: {
                id: run.id.toString(),
                repoId: repo.id,
                workflowId: workflow.id,
                workflowName: wf.name,
                commitSha: run.head_sha,
                event: run.event,
                status: run.status?.toUpperCase() || "QUEUED",
                conclusion: run.conclusion?.toUpperCase(),
                createdAt: new Date(run.created_at),
                updatedAt: new Date(run.updated_at),
              },
              update: {
                status: run.status?.toUpperCase() || "QUEUED",
                conclusion: run.conclusion?.toUpperCase(),
                updatedAt: new Date(run.updated_at),
              },
            });
          }
        }
      } catch (err) {
        console.error(`[GitHubService] Failed to sync data for repo ${repo.name}:`, err);
      }
    }
  }

  /**
   * Dispatch a workflow
   */
  static async dispatchWorkflow(
    userId: string,
    owner: string,
    repo: string,
    workflowId: string | number,
    ref: string = "main"
  ): Promise<void> {
    const octokit = await this.getOctokit(userId);
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
    });
  }

  /**
   * Get an authenticated Octokit instance for a user
   */
  static async getOctokit(userId: string): Promise<Octokit> {
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: { userId, provider: "github" },
    });

    if (!oauthAccount || !oauthAccount.accessToken) {
      throw new Error("GitHub account not linked");
    }

    return new Octokit({
      auth: decrypt(oauthAccount.accessToken),
    });
  }

  /**
   * Get contents of a directory or file
   */
  static async getContents(
    userId: string,
    owner: string,
    repo: string,
    path: string = "",
    ref: string = "main",
  ): Promise<any> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    return data;
  }

  /**
   * Get raw file content
   */
  static async getFileContent(
    userId: string,
    owner: string,
    repo: string,
    path: string,
    ref: string = "main",
  ): Promise<string> {
    const octokit = await this.getOctokit(userId);
    const { data }: any = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
      headers: { accept: "application/vnd.github.v3.raw" },
    });
    return typeof data === "string" ? data : JSON.stringify(data);
  }

  /**
   * Create or update a file
   */
  static async createOrUpdateFile(
    userId: string,
    owner: string,
    repo: string,
    path: string,
    options: {
      content: string,
      message: string,
      branch?: string,
      sha?: string, // Required for updates
    }
  ): Promise<any> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: options.message,
      content: Buffer.from(options.content).toString("base64"),
      branch: options.branch,
      sha: options.sha,
    });
    return data;
  }

  /**
   * List branches
   */
  static async getBranches(
    userId: string,
    owner: string,
    repo: string,
  ): Promise<string[]> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
    });
    return data.map(b => b.name);
  }

  /**
   * List Pull Requests
   */
  static async listPullRequests(
    userId: string,
    owner: string,
    repo: string,
    status: "open" | "closed" | "all" = "open"
  ): Promise<any[]> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: status,
    });
    return data;
  }

  /**
   * Create Pull Request
   */
  static async createPullRequest(
    userId: string,
    owner: string,
    repo: string,
    options: {
      title: string,
      head: string,
      base: string,
      body?: string,
      draft?: boolean
    }
  ): Promise<any> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
      draft: options.draft,
    });
    return data;
  }

  /**
   * Get PR Diff
   */
  static async getPullRequestDiff(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<string> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      headers: { accept: "application/vnd.github.v3.diff" },
    });
    return data as any as string;
  }

  /**
   * Merge Pull Request
   */
  static async mergePullRequest(
    userId: string,
    owner: string,
    repo: string,
    pullNumber: number,
    commitMessage?: string
  ): Promise<any> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      commit_message: commitMessage,
    });
    return data;
  }

  /**
   * List Issues
   */
  static async listIssues(
    userId: string,
    owner: string,
    repo: string,
    status: "open" | "closed" | "all" = "open"
  ): Promise<any[]> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: status,
    });
    return data;
  }

  /**
   * Create Issue
   */
  static async createIssue(
    userId: string,
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[]
  ): Promise<any> {
    const octokit = await this.getOctokit(userId);
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
  }
}





