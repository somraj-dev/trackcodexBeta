import { prisma } from "../services/prisma";
import { requireAuth } from "../middleware/auth";
import { NotificationService } from "../services/notification";
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
            customProfile: true,
            posts: true,
            comments: true,
            repositories: true,
            organizations: true,
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
        const { customProfile, ...rest } = userData as any;
        return { ...rest, profile: customProfile };
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
        reply.clearCookie("session_id", { path: "/" });

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
          email: false, // Don't expose email
          avatar: true,
          role: true,
          createdAt: true,
          customProfile: {
            select: {
              bio: true,
              location: true,
              website: true,
              company: true,
              followersCount: true,
              followingCount: true,
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
              followingId: userId,
            },
          },
        });
        isFollowing = !!follow;
      }

      return {
        ...user,
        followers: (user as any).customProfile?.followersCount || 0,
        following: (user as any).customProfile?.followingCount || 0,
        bio: (user as any).customProfile?.bio || "",
        location: (user as any).customProfile?.location || "",
        website: (user as any).customProfile?.website || "",
        company: (user as any).customProfile?.company || "",
        isFollowing,
      };
    } catch (error) {
      console.error("Get user profile error:", error);
      return reply.code(500).send({ message: "Failed to fetch user profile" });
    }
  });

  // Follow a user
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
      await prisma.follow.create({
        data: {
          followerId: currentUser.userId,
          followingId: targetUserId,
        },
      });

      // Update counts
      await prisma.profile.update({
        where: { userId: targetUserId },
        data: { followersCount: { increment: 1 } },
      });

      await prisma.profile.update({
        where: { userId: currentUser.userId },
        data: { followingCount: { increment: 1 } },
      });

      // Notify target user
      await NotificationService.create(
        targetUserId,
        "FOLLOW",
        "New Follower",
        `@${currentUser.username} is now following you.`,
        `/users/${currentUser.id}`,
        { followerId: currentUser.userId }
      );

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

      // Delete the follow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: targetUserId,
          },
        },
      });

      // Update counters in Profile
      await prisma.profile.update({
        where: { userId: targetUserId },
        data: { followersCount: { decrement: 1 } },
      }).catch(e => console.error("Could not decrement followersCount for target user", e));

      await prisma.profile.update({
        where: { userId: currentUser.userId },
        data: { followingCount: { decrement: 1 } },
      }).catch(e => console.error("Could not decrement followingCount for current user", e));

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
              customProfile: {
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
          followersCount: (u as any).customProfile?.followersCount || 0,
          followingCount: (u as any).customProfile?.followingCount || 0,
        };
        delete (mapped as any).customProfile;
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
              customProfile: {
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
          followersCount: (u as any).customProfile?.followersCount || 0,
          followingCount: (u as any).customProfile?.followingCount || 0,
        };
        delete (mapped as any).customProfile;
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

  // Unfollow a user
  fastify.delete("/users/:userId/follow", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const currentUser = (request as any).user;

    if (!currentUser) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: userId,
          },
        },
      });

      if (!follow) {
        return reply.code(404).send({ message: "Not following this user" });
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.userId,
            followingId: userId,
          },
        },
      });

      // Update counts
      await prisma.profile.update({
        where: { userId },
        data: { followersCount: { decrement: 1 } },
      });

      await prisma.profile.update({
        where: { userId: currentUser.userId },
        data: { followingCount: { decrement: 1 } },
      });

      return { success: true, message: "Successfully unfollowed user" };
    } catch (error) {
      console.error("Unfollow error:", error);
      return reply.code(500).send({ message: "Failed to unfollow user" });
    }
  });

  // Get user's followers
  fastify.get("/users/:userId/followers", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            include: { customProfile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return followers.map((f: any) => ({
        ...f.follower,
        profile: f.follower.customProfile,
        customProfile: undefined
      }));
    } catch (error) {
      console.error("Get followers error:", error);
      return reply.code(500).send({ message: "Failed to fetch followers" });
    }
  });

  // Get users that this user follows
  fastify.get("/users/:userId/following", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            include: { customProfile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return following.map((f: any) => ({
        ...f.following,
        profile: f.following.customProfile,
        customProfile: undefined
      }));
    } catch (error) {
      console.error("Get following error:", error);
      return reply.code(500).send({ message: "Failed to fetch following" });
    }
  });

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
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { customProfile: true },
        take: 20,
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.customProfile,
        customProfile: undefined
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
        include: { customProfile: true },
        orderBy: {
          customProfile: {
            followersCount: "desc",
          },
        },
        take: 10,
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.customProfile,
        customProfile: undefined
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
          id: {
            notIn: currentUser ? [...followingIds, currentUser.userId] : [],
          },
        },
        include: { customProfile: true },
        take: 5,
        orderBy: {
          customProfile: {
            followersCount: "desc",
          },
        },
      });

      return users.map((u: any) => ({
        ...u,
        profile: u.customProfile,
        customProfile: undefined
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
