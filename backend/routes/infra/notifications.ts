import { FastifyInstance } from 'fastify';
import { prisma } from "../../services/infra/prisma";
import { NotificationService } from '../../services/notification';
import { requireAuth } from '../middleware/auth';

export async function notificationRoutes(fastify: FastifyInstance) {

    // Get My Notifications
    fastify.get('/notifications', { preHandler: requireAuth }, async (request, reply) => {
        const currentUser = (request as any).user;

        try {
            const list = await NotificationService.getAll(currentUser.userId);
            return list;
        } catch (error: any) {
            console.error("[Notifications] Error fetching:", error.message);
            return [];
        }
    });

    // Mark as Read
    fastify.post('/notifications/:id/read', { preHandler: requireAuth }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const currentUser = (request as any).user;

        // Security check: ensure notification belongs to user
        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.userId !== currentUser.userId) {
            return reply.code(404).send({ message: "Notification not found" });
        }

        await NotificationService.markRead(id);
        return { success: true };
    });

    // Mark All Read
    fastify.post('/notifications/read-all', { preHandler: requireAuth }, async (request, reply) => {
        const currentUser = (request as any).user;
        await NotificationService.markAllRead(currentUser.userId);
        return { success: true };
    });
}
