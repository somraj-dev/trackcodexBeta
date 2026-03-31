
import { FastifyInstance } from 'fastify';
import { prisma } from "../../services/infra/prisma";
import { requireAuth, requireRole } from '../../middleware/auth';
import { logSensitiveOperation } from '../../services/activity/auditLogger';
import { revokeAllUserSessions } from '../../services/auth/session';

// Shared prisma instance

export async function adminRoutes(fastify: FastifyInstance) {

    // Protect all admin routes
    fastify.addHook('preHandler', requireRole('admin'));

    // List Users (Paginated & Searchable)
    fastify.get('/admin/users', async (request, reply) => {
        const { page = 1, limit = 20, search } = request.query as any;
        const skip = (Number(page) - 1) * Number(limit);

        try {
            const whereClause = search ? {
                OR: [
                    { email: { contains: search, mode: 'insensitive' as any } },
                    { username: { contains: search, mode: 'insensitive' as any } }
                ]
            } : {};

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where: whereClause,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        role: true,
                        accountLocked: true,
                        createdAt: true,
                        _count: { select: { sessions: true } }
                    }
                }),
                prisma.user.count({ where: whereClause })
            ]);

            return {
                data: users,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch users' });
        }
    });

    // Platform Stats (Command Center)
    fastify.get('/admin/stats', async (request, reply) => {
        try {
            const [userCount, repoCount, activeSessions, jobCount, hackathonCount] = await Promise.all([
                prisma.user.count(),
                prisma.repository.count(),
                prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
                prisma.job.count(),
                (prisma as any).hackathon.count()
            ]);

            return {
                users: userCount,
                repositories: repoCount,
                active_sessions: activeSessions,
                jobs: jobCount,
                hackathons: hackathonCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch platform stats' });
        }
    });

    // Platform Pulse (Recent Events)
    fastify.get('/admin/pulse', async (request, reply) => {
        try {
            const events = await prisma.auditLog.findMany({
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: {
                        select: { id: true, username: true, email: true }
                    }
                }
            });
            return events;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch pulse events' });
        }
    });

    // User Activity History
    fastify.get('/admin/users/:userId/activity', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        try {
            const logs = await prisma.activityLog.findMany({
                where: { userId },
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: {
                    repo: { select: { name: true } },
                    workspace: { select: { name: true } }
                }
            });
            return logs;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch user activity' });
        }
    });

    // Global Issues (Complaints)
    fastify.get('/admin/issues', async (request, reply) => {
        const { status = 'OPEN' } = request.query as any;
        try {
            const issues = await prisma.issue.findMany({
                where: { status },
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { username: true, email: true } },
                    repo: { select: { name: true, ownerId: true } }
                }
            });
            return issues;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch platform issues' });
        }
    });

    // Create Hackathon
    fastify.post('/admin/hackathons', async (request, reply) => {
        const data = request.body as any;
        const adminUser = (request as any).user;

        try {
            const hackathon = await (prisma as any).hackathon.create({
                data: {
                    ...data,
                    creatorId: adminUser.userId,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate)
                }
            });
            return hackathon;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to create hackathon' });
        }
    });

    // Global Repository Management
    fastify.get('/admin/repositories', async (request, reply) => {
        const { page = 1, limit = 20, search, visibility } = request.query as any;
        const skip = (Number(page) - 1) * Number(limit);

        try {
            const whereClause: any = {};
            if (search) {
                whereClause.name = { contains: search, mode: 'insensitive' };
            }
            if (visibility) {
                whereClause.visibility = visibility;
            }

            const [repos, total] = await Promise.all([
                prisma.repository.count({ where: whereClause }),
                prisma.repository.findMany({
                    where: whereClause,
                    skip,
                    take: Number(limit),
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        owner: { select: { username: true, email: true } },
                        _count: { select: { forks: true, stars: true, issues: true } }
                    }
                })
            ]);

            return {
                data: repos,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch repositories' });
        }
    });

    // Lock/Unlock Repository
    fastify.post('/admin/repositories/:repoId/lock', async (request, reply) => {
        const { repoId } = request.params as { repoId: string };
        const { locked, reason } = request.body as { locked: boolean; reason?: string };
        const adminUser = (request as any).user;

        try {
            const updatedRepo = await prisma.repository.update({
                where: { id: repoId },
                data: { 
                    settings: { 
                        ...(await prisma.repository.findUnique({ where: { id: repoId } }))?.settings as any, 
                        isLocked: locked, 
                        lockReason: reason 
                    } 
                }
            });

            await logSensitiveOperation(
                adminUser.userId,
                locked ? 'lock_repo' : 'unlock_repo',
                'repository',
                repoId,
                request.ip,
                request.headers['user-agent'] || 'system',
                true,
                { reason }
            );

            return { message: `Repository ${updatedRepo.name} has been ${locked ? 'locked' : 'unlocked'}.` };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update repository lock status' });
        }
    });

    // Advanced Audit Log Search
    fastify.get('/admin/audit-logs', async (request, reply) => {
        const { actorId, action, targetId, startDate, endDate, page = 1, limit = 50 } = request.query as any;
        const skip = (Number(page) - 1) * Number(limit);

        try {
            const whereClause: any = {};
            if (actorId) whereClause.actorId = actorId;
            if (action) whereClause.action = action;
            if (targetId) whereClause.resource = targetId;
            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt.gte = new Date(startDate);
                if (endDate) whereClause.createdAt.lte = new Date(endDate);
            }

            const logs = await prisma.auditLog.findMany({
                where: whereClause,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    actor: { select: { username: true, email: true } }
                }
            });

            return logs;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to search audit logs' });
        }
    });

    // System Health Status 
    fastify.get('/admin/system/health', async (request, reply) => {
        const os = await import('os');
        const process = await import('process');
        
        return {
            status: "OPERATIONAL",
            uptime: process.uptime(),
            load: os.loadavg(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                usage: process.memoryUsage()
            },
            node_version: process.version,
            timestamp: new Date().toISOString()
        };
    });

    // Ban User
    fastify.post('/admin/users/:userId/ban', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const { reason } = request.body as { reason?: string };
        const adminUser = (request as any).user;

        try {
            // Prevent self-ban
            if (userId === adminUser.userId) {
                return reply.code(400).send({ error: 'Cannot ban yourself' });
            }

            // Lock account
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { accountLocked: true }
            });

            // Revoke sessions
            await revokeAllUserSessions(userId);

            // Audit
            await logSensitiveOperation(
                adminUser.userId,
                'ban_user',
                'user',
                userId,
                request.ip,
                request.headers['user-agent'] || 'system',
                true,
                { reason }
            );

            return { message: `User ${updatedUser.email} has been banned and sessions revoked.` };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to ban user' });
        }
    });

    // Unban User
    fastify.post('/admin/users/:userId/unban', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const adminUser = (request as any).user;

        try {
            await prisma.user.update({
                where: { id: userId },
                data: { accountLocked: false }
            });

            await logSensitiveOperation(
                adminUser.userId,
                'unban_user',
                'user',
                userId,
                request.ip,
                request.headers['user-agent'] || 'system',
                true
            );

            return { message: 'User unbanned' };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to unban user' });
        }
    });
}




