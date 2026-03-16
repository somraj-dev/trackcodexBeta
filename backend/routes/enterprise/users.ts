import { prisma } from "../../services/infra/prisma";
import { requireAuth } from "../../middleware/auth";
import { NotificationService } from "../../services/infra/notification";
import { FastifyInstance } from "fastify";

// Shared prisma instance

export async function userRoutes(fastify: FastifyInstance) {
  // Export User Data
  fastify.get(
    "/users/me/export",
    { preHandler: requireAuth },
    async (request, reply) => {
      const currentUser = (request as any).user;
      try {
        const userData = await prisma.user.findUnique({
          where: { id: currentUser.userId },
          include: {
            profile: true,
            communityPosts: true,
            communityComments: true,
            repositories: true,
            orgMemberships: true,
            followings: true,
            followers: true,
          },
        });

        if (!userData) {
          return reply.code(404).send({ message: "User not found" });
        }

        // Return as JSON file
        reply.header(
          "Content-Disposition",
          `attachment; filename="trackcodex-export-${currentUser.username}.json"`,
        );
        const { profile, ...rest } = userData as any;
        return { ...rest, profile };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: "Export failed" });
      }
    },
  );

  // Delete User Account
  fastify.delete(
    "/users/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const currentUser = (request as any).user;
      try {
        // Delete related data first (manual cascade if needed, though Prisma usually handles this)
        // Deleting the user should cascade to profile, posts, etc.
        await prisma.user.delete({
          where: { id: currentUser.userId },
        });

        // Clear session cookie
        reply.cookie("session_id", "", { path: "/", expires: new Date(0) });

        return { success: true, message: "Account deleted successfully" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: "Account deletion failed" });
      }
    },
  );

  // Get user profile by ID
  fastify.get("/users/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const currentUser = (request as any).user;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      const user = await prisma.user.findFirst({
        where: {
          OR: isUuid
            ? [{ id: userId }, { username: { equals: userId, mode: "insensitive" } }]
            : [{ username: { equals: userId, mode: "insensitive" } }],
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              location: true,
              website: true,
              company: true,
              followersCount: true,
              followingCount: true,
            },
          },
          freelancerProfile: {
            select: {
              jobsCompleted: true,
              rating: true,
              isPublic: true,
              reviews: {
                select: {
                  rating: true,
                  comment: true,
                  createdAt: true,
                },
                take: 5,
                orderBy: { createdAt: "desc" },
              },
            },
          },
          skillScore: {
            select: {
              coding: true,
              quality: true,
              bugDetection: true,
              security: true,
              collaboration: true,
              architecture: true,
              consistency: true,
              communityImpact: true,
              lastCalculatedAt: true,
            },
          },
          skillMetrics: {
            select: {
              commitsPushed: true,
              prCreated: true,
              prMerged: true,
              linesChanged: true,
              bugsFixed: true,
              bugsReported: true,
              vulnerabilitiesFixed: true,
              securityIssuesReported: true,
              prReviewsGiven: true,
              currentStreak: true,
              starsReceived: true,
              followers: true,
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ message: "User not found" });
      }

      // Check if current user is following this user
      let isFollowing = false;
      if (currentUser) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.userId,
              followingId: user.id,
            },
          },
        });
        isFollowing = !!follow;
      }

      return {
        ...user,
        followers: (user as any).profile?.followersCount || 0,
        following: (user as any).profile?.followingCount || 0,
        bio: (user as any).profile?.bio || "",
        location: (user as any).profile?.location || "",
        website: (user as any).profile?.website || "",
        company: (user as any).profile?.company || "",
        isFollowing,
        freelancerProfile: (user as any).freelancerProfile || null,
        skillScore: (user as any).skillScore || null,
        skillMetrics: (user as any).skillMetrics || null,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return reply.code(500).send({ message: "Failed to fetch user profile" });
    }
  });

  // User Activity Feed — real per-user event log
  fastify.get("/users/:userId/activity", async (request, reply) => {
    let { userId } = request.params as { userId: string };
    const { limit } = request.query as { limit?: string };
    const take = limit ? Math.min(parseInt(limit), 50) : 10;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userId, mode: "insensitive" } },
        select: { id: true }
      });
      if (user) userId = user.id;
    }

    try {
      const logs = await prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          repo: { select: { id: true, name: true } },
        },
      });
      return logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        repoName: log.repo?.name ?? null,
        repoId: log.repo?.id ?? null,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error("User activity fetch error:", error);
      return reply.code(500).send({ message: "Failed to fetch user activity" });
    }
  });

  // User Contribution Heatmap — groups ActivityLog by date for the past 365 days
  fastify.get("/users/:userId/contributions", async (request, reply) => {
    let { userId } = request.params as { userId: string };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: userId, mode: "insensitive" } },
        select: { id: true }
      });
      if (user) userId = user.id;
    }

    try {
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);

      const logs = await prisma.activityLog.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      // Count per date
      const countMap: Record<string, number> = {};
      logs.forEach((log: any) => {
        const date = log.createdAt.toISOString().split("T")[0];
        countMap[date] = (countMap[date] || 0) + 1;
      });

      // Build full 365-day array
      const result = [];
      for (let i = 364; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const count = countMap[dateStr] || 0;
        const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4;
        result.push({ date: dateStr, count, level });
      }
      const total = Object.values(countMap).reduce((a: number, b: number) => a + b, 0);
      return { contributions: result, total };
    } catch (error) {
      console.error("Contributions fetch error:", error);
      return reply.code(500).send({ message: "Failed to fetch contributions" });
    }
  });


  fastify.post("/users/:userId/follow", async (request, reply) => {
    const { userId: targetUserId } = request.params as { userId: string };
    const currentUser = (request as any).user;

    if (!currentUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    if (currentUser.userId === targetUserId) {
      return reply.code(400).send({ message: "Cannot follow yourself" });
    }

    try {
      // 1. Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: targetUserId,
          },
        },
      });

      if (existingFollow) {
        return reply.code(400).send({ message: "Already following this user" });
      }

      // 2. Check target user privacy
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true, isPrivate: true },
      });

      if (!targetUser) {
        return reply.code(404).send({ message: "User not found" });
      }

      if (targetUser.isPrivate) {
        // Handle Follow Request
        const existingRequest = await prisma.followRequest.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.userId,
              followingId: targetUserId,
            },
          },
        });

        if (existingRequest) {
          return reply.code(400).send({
            message: "Follow request already pending",
            status: existingRequest.status,
          });
        }

        await prisma.followRequest.create({
          data: {
            followerId: currentUser.userId,
            followingId: targetUserId,
            status: "PENDING",
          },
        });

        // Notify target user
        await NotificationService.create(
          targetUserId,
          "FOLLOW_REQUEST",
          "New Follow Request",
          `@${currentUser.username} wants to follow you.`,
          `/users/${currentUser.id}`,
          { followerId: currentUser.userId }
        );

        return { success: true, message: "Follow request sent" };
      }

      // 3. Public Account - Direct Follow
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId: currentUser.userId,
            followingId: targetUserId,
          },
        }),
        // Directly increment counters (no outbox — ensures immediate persistence)
        prisma.profile.upsert({
          where: { userId: targetUserId },
          create: { userId: targetUserId, followersCount: 1, followingCount: 0 },
          update: { followersCount: { increment: 1 } },
        }),
        prisma.profile.upsert({
          where: { userId: currentUser.userId },
          create: { userId: currentUser.userId, followersCount: 0, followingCount: 1 },
          update: { followingCount: { increment: 1 } },
        }),
      ]);

      // Notify target user (outside transaction for non-critical path)
      NotificationService.create(
        targetUserId,
        "FOLLOW",
        "New Follower",
        `@${currentUser.username} is now following you.`,
        `/users/${currentUser.id}`,
        { followerId: currentUser.userId }
      ).catch(e => console.error("Follow notification failed:", e));

      return { success: true, message: "Successfully followed user" };
    } catch (error) {
      console.error("Follow error:", error);
      return reply.code(500).send({ message: "Failed to follow user" });
    }
  });

  // Unfollow a user
  fastify.delete("/users/:userId/follow", async (request, reply) => {
    const currentUser = (request as any).user;
    if (!currentUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { userId: targetUserId } = request.params as { userId: string };

    try {
      // Find the existing follow
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: targetUserId,
          },
        },
      });

      if (!follow) {
        return reply.code(404).send({ message: "Not following this user" });
      }

      // Delete the follow and update counters directly
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId: currentUser.userId,
              followingId: targetUserId,
            },
          },
        }),
        prisma.profile.updateMany({
          where: { userId: targetUserId },
          data: { followersCount: { decrement: 1 } },
        }),
        prisma.profile.updateMany({
          where: { userId: currentUser.userId },
          data: { followingCount: { decrement: 1 } },
        }),
      ]);

      return { success: true, message: "Successfully unfollowed user" };
    } catch (error) {
      console.error("Unfollow error:", error);
      return reply.code(500).send({ message: "Failed to unfollow user" });
    }
  });

  // Get user followers
  fastify.get("/users/:userId/followers", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              profile: {
                select: {
                  followersCount: true,
                  followingCount: true,
                }
              }
            },
          },
        },
      });
      return followers.map(f => {
        const u = f.follower;
        const mapped = {
          ...u,
          followersCount: (u as any).profile?.followersCount || 0,
          followingCount: (u as any).profile?.followingCount || 0,
        };
        delete (mapped as any).profile;
        return mapped;
      });
    } catch (error) {
      console.error("Error fetching followers:", error);
      return reply.code(500).send({ message: "Failed to fetch followers" });
    }
  });

  // Get users followed by user
  fastify.get("/users/:userId/following", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    try {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              profile: {
                select: {
                  followersCount: true,
                  followingCount: true,
                }
              }
            },
          },
        },
      });
      return following.map(f => {
        const u = f.following;
        const mapped = {
          ...u,
          followersCount: (u as any).profile?.followersCount || 0,
          followingCount: (u as any).profile?.followingCount || 0,
        };
        delete (mapped as any).profile;
        return mapped;
      });
    } catch (error) {
      console.error("Error fetching following:", error);
      return reply.code(500).send({ message: "Failed to fetch following users" });
    }
  });

  // Get Pending Follow Requests
  fastify.get(
    "/users/follow-requests",
    { preHandler: requireAuth },
    async (request, reply) => {
      const currentUser = (request as any).user;
      try {
        const requests = await prisma.followRequest.findMany({
          where: {
            followingId: currentUser.userId,
            status: "PENDING",
          },
          include: {
            follower: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        });
        return requests;
      } catch (error) {
        return reply.code(500).send({ message: "Failed to fetch follow requests" });
      }
    }
  );

  // Accept/Reject Follow Request
  fastify.post(
    "/users/follow-requests/:requestId/action",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { requestId } = request.params as { requestId: string };
      const { action } = request.body as { action: "ACCEPT" | "REJECT" };
      const currentUser = (request as any).user;

      try {
        const followReq = await prisma.followRequest.findUnique({
          where: { id: requestId },
        });

        if (!followReq || followReq.followingId !== currentUser.userId) {
          return reply.code(404).send({ message: "Request not found" });
        }

        if (action === "ACCEPT") {
          await prisma.$transaction([
            // Create follow
            prisma.follow.create({
              data: {
                followerId: followReq.followerId,
                followingId: followReq.followingId,
              },
            }),
            // Update counts
            prisma.profile.update({
              where: { userId: followReq.followingId },
              data: { followersCount: { increment: 1 } },
            }),
            prisma.profile.update({
              where: { userId: followReq.followerId },
              data: { followingCount: { increment: 1 } },
            }),
            // Delete request
            prisma.followRequest.delete({ where: { id: requestId } }),
          ]);

          // Notify follower
          await NotificationService.create(
            followReq.followerId,
            "FOLLOW_ACCEPTED",
            "Follow Request Accepted",
            `@${currentUser.username} accepted your follow request.`,
            `/users/${currentUser.id}`,
            { followingId: currentUser.userId }
          );

          return { success: true, message: "Request accepted" };
        } else {
          await prisma.followRequest.delete({ where: { id: requestId } });
          return { success: true, message: "Request rejected" };
        }
      } catch (error) {
        return reply.code(500).send({ message: "Failed to process request" });
      }
    }
  );

  // Search users
  fastify.get("/users/search", async (request, reply) => {
    const { q } = request.query as { q?: string };

    if (!q || q.length < 2) {
      return reply
        .code(400)
        .send({ message: "Query must be at least 2 characters" });
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { deletedAt: null },
            { accountLocked: false },
            { isPrivate: false },
            { username: { not: null } }
          ],
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { profile: true },
        take: 20,
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.profile,
      }));
    } catch (error) {
      console.error("Search error:", error);
      return reply.code(500).send({ message: "Search failed" });
    }
  });

  // Get trending users (most followers)
  fastify.get("/users/trending", async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { deletedAt: null },
            { accountLocked: false },
            { isPrivate: false },
            { username: { not: null } }
          ],
        },
        include: { profile: true },
        orderBy: {
          profile: {
            followersCount: "desc",
          },
        },
        take: 10,
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.profile,
      }));
    } catch (error) {
      console.error("Trending users error:", error);
      return reply
        .code(500)
        .send({ message: "Failed to fetch trending users" });
    }
  });

  // Get suggested users (random for now, can be improved with ML)
  fastify.get("/users/suggested", async (request, reply) => {
    const currentUser = (request as any).user;

    try {
      // Get users the current user is NOT following
      const following = currentUser
        ? await prisma.follow.findMany({
          where: { followerId: currentUser.id },
          select: { followingId: true },
        })
        : [];

      const followingIds = following.map((f) => f.followingId);

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { notIn: currentUser ? [...followingIds, currentUser.userId] : [] } },
            { deletedAt: null },
            { accountLocked: false },
            { isPrivate: false },
            { username: { not: null } }
          ],
        },
        include: { profile: true },
        take: 5,
        orderBy: {
          profile: {
            followersCount: "desc",
          },
        },
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.profile,
      }));
    } catch (error) {
      console.error("Suggested users error:", error);
      return reply
        .code(500)
        .send({ message: "Failed to fetch suggested users" });
    }
  });

  // Get User Activity
  fastify.get("/users/:userId/activity", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { page, limit } = request.query as { page?: string; limit?: string };

    const pageNum = Math.max(1, parseInt(page || "1"));
    const limitNum = Math.min(50, parseInt(limit || "20"));
    const skip = (pageNum - 1) * limitNum;

    try {
      const [activities, total] = await Promise.all([
        prisma.activityLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: limitNum,
          skip,
        }),
        prisma.activityLog.count({ where: { userId } }),
      ]);

      // Map to frontend expectation
      // activityService expects { activities: [], total }
      const mapped = activities.map((a) => ({
        id: a.id,
        userId: a.userId,
        action: a.action,
        metadata: a.details,
        createdAt: a.createdAt,
      }));

      return { activities: mapped, total };
    } catch (error) {
      console.error("Activity fetch error:", error);
      return reply.code(500).send({ message: "Failed to fetch activity" });
    }
  });

  // Get User Activity Stats
  fastify.get("/users/:userId/activity/stats", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const stats = await prisma.activityLog.groupBy({
        by: ["action"],
        where: { userId },
        _count: {
          action: true,
        },
      });

      // Transform to { ACTION_NAME: count }
      const result: Record<string, number> = {};
      stats.forEach((s) => {
        result[s.action] = s._count.action;
      });

      return result;
    } catch (error) {
      console.error("Activity stats error:", error);
      return reply
        .code(500)
        .send({ message: "Failed to fetch activity stats" });
    }
  });
}




