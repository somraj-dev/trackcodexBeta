import { FastifyInstance } from "fastify";
import { authRoutes } from "./auth/auth";
import { rateLimiter } from "../middleware/rateLimiter";
import { authOtpRoutes } from "./auth/auth_otp";
import { workspaceRoutes } from "./workspace/workspaces";
import { workspaceStarsRoutes } from "./workspace/workspace-stars";
import { repositoryRoutes } from "./git/repositories";
import { jobRoutes } from "./hiring/jobs";
import { orgRoutes } from "./enterprise/organizations";
import { communityRoutes } from "./community/community";
import { profileRoutes } from "./activity/profile";
import { radarRoutes } from "./activity/radar";
import { hiringRoutes } from "./hiring/hiring";
import { growthRoutes } from "./hiring/growth";

import { forgeRoutes } from "./ai/forge";
import { notificationRoutes } from "./infra/notifications";
import { adminRoutes } from "./admin/admin";
import { searchRoutes } from "./infra/search";
import { workspaceCollaborationRoutes } from "./workspace/workspace-collaboration";
import { fileRoutes } from "./workspace/files";
import { enterpriseRoutes } from "./enterprise/enterprise";
import { collaborationRoutes } from "./workspace/collaboration";
import { executionRoutes } from "./workspace/execution";
import { webhookRoutes } from "./git/webhooks";
import { activityRoutes } from "./activity/activity";
import { teamRoutes } from "./enterprise/teams";
import { insightsRoutes } from "./git/insights";
import { wikiRoutes } from "./git/wiki";
import { messageRoutes } from "./infra/messages";
import portfolioRoutes from "./activity/portfolio";
import statsRoutes from "./activity/stats";
import { userRoutes } from "./enterprise/users";
import { leaderboardRoutes } from "./activity/leaderboard";
import { extensionRoutes } from "./workspace/extensions";
import { ideConfigRoutes } from "./workspace/ideconfig";
import { galleryRoutes } from "./infra/gallery";
import integrationRoutes from "./auth/integrations";
import { applicationRoutes } from "./hiring/applications";
import workflowRoutes from "./infra/ci";
import { githubishRoutes } from "./githubish";

export async function routes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (request) => {
    console.log(
      `[DEBUG] Incoming Request: ${request.method} ${request.url} from ${request.ip}`,
    );
  });

  fastify.get("/", async () => {
    return {
      status: "ok",
      message: "TrackCodex Backend API v2 (/api/v1 registered)",
    };
  });

  await fastify.register(authRoutes);
  await fastify.register(authOtpRoutes);
  await fastify.register(notificationRoutes);
  await fastify.register(workspaceRoutes);
  await fastify.register(repositoryRoutes);
  await fastify.register(jobRoutes);
  await fastify.register(orgRoutes);
  await fastify.register(communityRoutes, { prefix: "/community" });
  await fastify.register(profileRoutes);
  await fastify.register(growthRoutes);
  await fastify.register(forgeRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(workspaceCollaborationRoutes);
  await fastify.register(fileRoutes);
  await fastify.register(enterpriseRoutes, { prefix: "/enterprises" });
  await fastify.register(collaborationRoutes);
  await fastify.register(executionRoutes);
  await fastify.register(webhookRoutes);
  await fastify.register(activityRoutes);
  await fastify.register(teamRoutes);
  await fastify.register(insightsRoutes);
  await fastify.register(wikiRoutes);
  await fastify.register(userRoutes);
  await fastify.register(radarRoutes);
  await fastify.register(portfolioRoutes, { prefix: "/portfolio" });
  await fastify.register(statsRoutes, { prefix: "/stats" });
  await fastify.register(messageRoutes, { prefix: "/messages" });
  await fastify.register(leaderboardRoutes);
  await fastify.register(extensionRoutes);
  await fastify.register(ideConfigRoutes);
  await fastify.register(galleryRoutes, { prefix: "/api/gallery" });

  const { forgeAIRoutes } = await import("./ai/forgeai");
  await fastify.register(forgeAIRoutes, { prefix: "/forgeai" });

  const { walletRoutes } = await import("./infra/wallet");
  await fastify.register(walletRoutes, { prefix: "/wallet" });

  const { default: deploymentRoutes } = await import("./infra/deployments");
  await fastify.register(deploymentRoutes);
  await fastify.register(integrationRoutes);
  await fastify.register(applicationRoutes);
  await fastify.register(workflowRoutes);
  await fastify.register(githubishRoutes, { prefix: "/github" });
}



