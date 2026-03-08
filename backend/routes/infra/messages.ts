import { FastifyInstance } from "fastify";
import { prisma } from "../../services/infra/prisma";
import { AppError, BadRequest, NotFound, Forbidden } from "../../utils/AppError";
import { RealtimeService } from "../../services/infra/realtime";
import { requireAuth } from "../../middleware/auth";

// Shared prisma instance

export async function messageRoutes(fastify: FastifyInstance) {
  // Apply auth to all message routes
  fastify.addHook("preHandler", requireAuth);
  // 1. Get All Conversations for Current User
  fastify.get("/conversations", async (request, reply) => {
    const user = (request as any).user;
    if (!user) throw new AppError("Unauthorized", 401);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Last message preview
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return conversations;
  });

  // 2. Create or Get Direct Conversation (One-on-One)
  fastify.post("/conversations", async (request, reply) => {
    const user = (request as any).user;
    if (!user) throw new AppError("Unauthorized", 401);

    const { targetUserId } = request.body as { targetUserId: string };
    if (!targetUserId) throw BadRequest("Target User ID required");

    if (user.userId === targetUserId) {
      throw BadRequest("Cannot message yourself");
    }

    // Check availability
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw NotFound("User not found");

    // Find existing direct conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: user.userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new
    const conversation = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        participants: {
          create: [{ userId: user.userId }, { userId: targetUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    return conversation;
  });

  // 3. Get Messages for Conversation
  fastify.get("/conversations/:id/messages", async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    // Verify membership
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.userId,
        },
      },
    });

    if (!membership) throw Forbidden("Not a member of this conversation");

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      take: 100, // Limit for now
    });

    return messages;
  });

  // 4. Send Message
  fastify.post("/conversations/:id/messages", async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };

    if (!content || !content.trim())
      throw BadRequest("Message cannot be empty");

    // Verify membership
    const membership = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.userId,
        },
      },
    });

    if (!membership) throw Forbidden("Not a member of this conversation");

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });

    // Notify others via Socket.io
    // Since RealtimeService handles broadcasting, we'll emit to "conversation_room_${id}"
    // Assuming RealtimeService is setup for this or we just accept poll for now.
    // Let's assume polling in Phase 1, but we'll add the hook if RealtimeService exists.
    try {
      // Broadcast to specific conversation room
      RealtimeService.broadcastToRoom(id, {
        type: "new_message",
        ...message,
      });
    } catch (e: any) {
      request.log.warn(e, "Failed to broadcast message via socket");
    }

    return message;
  });

  // 5. Mark Conversation as Read
  fastify.put("/conversations/:id/read", async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    if (!user) throw new AppError("Unauthorized", 401);

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: user.userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  });

  // 6. Toggle Emoji Reaction on a Message
  fastify.put("/messages/:id/react", async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const { emoji } = request.body as { emoji: string };

    if (!user) throw new AppError("Unauthorized", 401);

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw NotFound("Message not found");
    }

    const metadata: any = message.metadata || {};
    metadata.reactions = metadata.reactions || {};

    // Toggle reaction for this user
    if (metadata.reactions[emoji]?.includes(user.userId)) {
      metadata.reactions[emoji] = metadata.reactions[emoji].filter(
        (uId: string) => uId !== user.userId
      );
      if (metadata.reactions[emoji].length === 0) {
        delete metadata.reactions[emoji];
      }
    } else {
      metadata.reactions[emoji] = metadata.reactions[emoji] || [];
      metadata.reactions[emoji].push(user.userId);
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { metadata },
    });

    // Broadcast the update via sockets
    RealtimeService.broadcastReaction(
      message.conversationId,
      id,
      user.userId,
      emoji
    );

    return { success: true, message: updatedMessage };
  });
}




