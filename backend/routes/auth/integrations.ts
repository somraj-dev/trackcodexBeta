import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { encrypt, decrypt } from "../../services/auth/encryption";
import { requireAuth } from "../../middleware/auth";
import { OAuthService } from "../../services/auth/oauth";

export default async function integrationRoutes(fastify: FastifyInstance) {
    // Save or update an OAuth provider token for the current user
    fastify.post(
        "/integrations/connect",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;
            const { provider, accessToken, providerUsername } = request.body as {
                provider: string;
                accessToken: string;
                providerUsername?: string;
            };

            if (!provider || !accessToken) {
                return reply
                    .status(400)
                    .send({ error: "provider and accessToken are required" });
            }

            if (!["github", "gitlab", "google"].includes(provider)) {
                return reply.status(400).send({ error: "Invalid provider" });
            }

            try {
                // Encrypt the token before storing
                const encryptedToken = encrypt(accessToken);

                // Upsert: update if exists, create if not
                await prisma.oAuthAccount.upsert({
                    where: {
                        provider_providerAccountId: {
                            provider,
                            providerAccountId: providerUsername || userId,
                        },
                    },
                    update: {
                        accessToken: encryptedToken,
                        scope:
                            provider === "github"
                                ? "repo,read:user,read:org"
                                : provider === "gitlab"
                                    ? "api,read_user,read_repository"
                                    : "profile,email",
                    },
                    create: {
                        provider,
                        providerAccountId: providerUsername || userId,
                        accessToken: encryptedToken,
                        tokenType: "bearer",
                        scope:
                            provider === "github"
                                ? "repo,read:user,read:org"
                                : provider === "gitlab"
                                    ? "api,read_user,read_repository"
                                    : "profile,email",
                        userId,
                    },
                });

                return reply.send({
                    success: true,
                    message: `${provider} token saved successfully`,
                });
            } catch (error: any) {
                console.error(`[Integrations] Failed to save ${provider} token:`, error);
                return reply.status(500).send({ error: "Failed to save token" });
            }
        }
    );

    // Get a decrypted OAuth token for the current user (frontend uses this to fetch repos)
    fastify.get(
        "/integrations/token/:provider",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;
            const { provider } = request.params as { provider: string };

            if (!["github", "gitlab", "google"].includes(provider)) {
                return reply.status(400).send({ error: "Invalid provider" });
            }

            try {
                const oauthAccount = await prisma.oAuthAccount.findFirst({
                    where: { userId, provider },
                });

                if (!oauthAccount || !oauthAccount.accessToken) {
                    return reply.status(404).send({
                        connected: false,
                        error: "No token found for this provider",
                    });
                }

                // Decrypt the token
                const decryptedToken = decrypt(oauthAccount.accessToken);

                return reply.send({
                    connected: true,
                    accessToken: decryptedToken,
                    provider,
                });
            } catch (error: any) {
                console.error(`[Integrations] Failed to get ${provider} token:`, error);
                return reply.status(500).send({ error: "Failed to retrieve token" });
            }
        }
    );

    // List all connected integrations for the current user
    fastify.get(
        "/integrations/status",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;

            try {
                const accounts = await prisma.oAuthAccount.findMany({
                    where: { userId },
                    select: {
                        provider: true,
                        providerAccountId: true,
                        scope: true,
                    },
                });

                const connected: Record<string, boolean> = {
                    github: false,
                    gitlab: false,
                    google: false,
                };

                for (const account of accounts) {
                    connected[account.provider] = true;
                }

                return reply.send({ connected, accounts });
            } catch (error: any) {
                console.error("[Integrations] Failed to get status:", error);
                return reply.status(500).send({ error: "Failed to get status" });
            }
        }
    );

    // Disconnect a provider
    fastify.delete(
        "/integrations/disconnect/:provider",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;
            const { provider } = request.params as { provider: string };

            try {
                await prisma.oAuthAccount.deleteMany({
                    where: { userId, provider },
                });

                return reply.send({
                    success: true,
                    message: `${provider} disconnected`,
                });
            } catch (error: any) {
                console.error(`[Integrations] Failed to disconnect ${provider}:`, error);
                return reply.status(500).send({ error: "Failed to disconnect" });
            }
        }
    );

    // Trigger full sync for GitHub
    fastify.get(
        "/integrations/sync/github",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;

            // Trigger sync in the background
            import("../../services/git/github").then(({ GitHubService }) => {
                GitHubService.syncAllData(userId).catch(err => {
                    console.error(`[Integrations] Background sync failed for user ${userId}:`, err);
                });
            });

            return reply.send({
                success: true,
                message: "Integration sync started in background",
            });
        }
    );

    // Exchange GitHub code for access token and connect
    fastify.post(
        "/integrations/github/callback",
        { preHandler: requireAuth },
        async (request: any, reply) => {
            const userId = request.user.userId;
            const { code } = request.body as { code: string };

            if (!code) {
                return reply.status(400).send({ error: "Code is required" });
            }

            try {
                // 1. Exchange code for access token
                const tokenData = await OAuthService.exchangeGithubCode(code);
                const accessToken = tokenData.access_token;

                if (!accessToken) {
                    throw new Error("No access token received from GitHub");
                }

                // 2. Fetch GitHub user info to get stable ID and username
                const githubUser = await OAuthService.getGithubUserInfo(accessToken);
                const providerGitHubId = githubUser.id;
                const providerUsername = githubUser.username;

                // 3. Encrypt and save token
                const encryptedToken = encrypt(accessToken);

                await prisma.oAuthAccount.upsert({
                    where: {
                        provider_providerAccountId: {
                            provider: "github",
                            providerAccountId: providerGitHubId,
                        },
                    },
                    update: {
                        accessToken: encryptedToken,
                        scope: "repo,read:user,read:org",
                        userId, // Ensure it's linked to current user
                    },
                    create: {
                        provider: "github",
                        providerAccountId: providerGitHubId,
                        accessToken: encryptedToken,
                        tokenType: "bearer",
                        scope: "repo,read:user,read:org",
                        userId,
                    },
                });

                return reply.send({
                    success: true,
                    provider: "github",
                    username: providerUsername,
                    accessToken: accessToken // Return to frontend for immediate use/sync if needed
                });
            } catch (error: any) {
                console.error("[Integrations] GitHub callback failed:", error);
                return reply.status(500).send({ error: error.message || "Failed to exchange GitHub code" });
            }
        }
    );
}
