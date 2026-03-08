import { prisma } from "../infra/prisma";
import { RealtimeService } from './realtime';
import { emailService } from './emailService';

export class NotificationService {

    // Create & Broadcast
    static async create(userId: string, type: string, title: string, message: string, link?: string, metadata?: any) {
        try {
            // 1. Save to DB
            const notif = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    read: false,
                    link,
                    metadata: metadata || {}
                }
            });

            // 2. Push via WebSocket
            RealtimeService.sendToUser(userId, {
                type: "NOTIFICATION",
                data: notif
            });

            // 3. Send Email Notification asynchronously
            prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            }).then(user => {
                if (user && user.email) {
                    emailService.sendAppNotification(
                        user.email,
                        title,
                        message,
                        link
                    ).catch(err => {
                        console.error("[NotificationService] Failed to send email for notification", err);
                    });
                }
            }).catch(e => {
                console.error("[NotificationService] Failed to fetch user email for notification", e);
            });

            return notif;
        } catch (e) {
            console.error("Failed to create notification", e);
        }
    }

    // Get All for User
    static async getAll(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Mark as Read
    static async markRead(id: string) {
        return prisma.notification.update({
            where: { id },
            data: { read: true }
        });
    }

    // Mark All Read
    static async markAllRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
    }
}





