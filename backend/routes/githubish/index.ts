import { FastifyPluginAsync } from "fastify";
import { githubReposRoutes } from "./repos";
import { githubIssuesRoutes } from "./issues";
import { githubPullRequestsRoutes } from "./pullRequests";
import { githubWebhooksRoutes } from "./webhooks";

export const githubishRoutes: FastifyPluginAsync = async (server) => {
    await server.register(githubReposRoutes);
    await server.register(githubIssuesRoutes);
    await server.register(githubPullRequestsRoutes);
    await server.register(githubWebhooksRoutes);
};
