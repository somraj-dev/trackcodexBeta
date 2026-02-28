import { FastifyRequest, FastifyReply } from "fastify";
import { getSession } from "../services/session";
import { prisma } from "../services/prisma";
import { supabaseAdmin } from "../services/supabase";
import { logSensitiveOperation } from "../services/auditLogger";

// Shared prisma instance

/**
 * Authentication middleware - reads session from HttpOnly cookie
 * Verifies session and attaches user info to request
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // 1. Try to get Supabase JWT from Authorization header
    const authHeader = request.headers.authorization;
    let supabaseUser: { id: string; email?: string } | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // If it looks like a JWT (roughly 3 parts separated by dots)
      if (token.split(".").length === 3) {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data.user) {
          supabaseUser = data.user;
        }
      }
    }

    if (supabaseUser) {
      // Find user in our database to get full profile (role, org, etc)
      const dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
        select: {
          id: true,
          email: true,
          role: true,
          // Add other fields you need in request.user
        },
      });

      if (dbUser) {
        (request as any).user = {
          userId: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          // Note: organizationId/workspaceId might need to be fetched differently
          // if they were stored in the session table before.
        };
        return; // Success with Supabase JWT
      }
    }

    // 2. Fallback to existing Session ID logic (Cookie or Bearer token)
    let sessionId = request.cookies?.session_id;
    if (!sessionId && authHeader?.startsWith("Bearer ")) {
      sessionId = authHeader.substring(7);
    }

    if (!sessionId) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Get and validate session from our database
    const sessionData = await getSession(sessionId);

    if (!sessionData) {
      reply.clearCookie("session_id");
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Session expired or invalid",
      });
    }

    // Attach user info to request
    (request as Record<string, any>).user = {
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      organizationId: sessionData.organizationId,
      workspaceId: sessionData.workspaceId,
    };

    // Attach CSRF token for response
    (request as Record<string, any>).csrfToken = sessionData.csrfToken;
  } catch (error: any) {
    return reply.code(401).send({
      error: "Unauthorized",
      message: error.message || "Authentication failed",
    });
  }
}

/**
 * CSRF validation middleware
 * Validates X-CSRF-Token header against stored session CSRF token
 * Must be used on all state-changing routes (POST, PUT, PATCH, DELETE)
 */
export async function requireCsrf(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Skip CSRF for GET/HEAD/OPTIONS (safe methods)
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return;
  }

  const csrfHeader = request.headers["x-csrf-token"] as string | undefined;
  const sessionCsrf = (request as any).csrfToken;

  if (!csrfHeader || !sessionCsrf || csrfHeader !== sessionCsrf) {
    return reply.code(403).send({
      error: "Forbidden",
      message: "Invalid or missing CSRF token",
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if session exists, but doesn't reject if missing
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    let sessionId = request.cookies?.session_id;
    if (!sessionId && request.headers.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        sessionId = authHeader.substring(7);
      }
    }

    if (sessionId) {
      const sessionData = await getSession(sessionId);

      if (sessionData) {
        (request as any).user = {
          userId: sessionData.userId,
          email: sessionData.email,
          role: sessionData.role,
          organizationId: sessionData.organizationId,
          workspaceId: sessionData.workspaceId,
        };
        (request as Record<string, any>).csrfToken = sessionData.csrfToken;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
}

/**
 * Role-based authorization middleware
 * Requires authentication and checks user role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // First ensure user is authenticated
    await requireAuth(request, reply);

    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      return reply.code(403).send({
        error: "Forbidden",
        message: `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}`,
      });
    }
  };
}

/**
 * Permission-based authorization middleware
 * Checks fine-grained permissions on specific resources
 */
export function requirePermission(
  resource: string,
  action: string,
  getResourceId?: (request: FastifyRequest) => string,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // First ensure user is authenticated
    await requireAuth(request, reply);

    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Super admins bypass permission checks (with audit trail)
    if (user.role === "super_admin") {
      logSensitiveOperation(
        user.userId, "permission_bypass", resource, action,
        request.ip, request.headers["user-agent"] || "unknown", true,
        { bypass: "super_admin", resource, action },
      ).catch(() => { }); // Fire-and-forget, don't block request
      return;
    }

    // Get resource ID if function provided
    const resourceId = getResourceId ? getResourceId(request) : null;

    // Check permission
    const hasPermission = await prisma.permission.findFirst({
      where: {
        userId: user.userId,
        resource,
        action,
        ...(resourceId ? { resourceId } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });

    if (!hasPermission) {
      return reply.code(403).send({
        error: "Forbidden",
        message: `You don't have permission to ${action} this ${resource}`,
      });
    }
  };
}

/**
 * Ownership check middleware
 * Verifies user owns the resource they're trying to access
 */
export function requireOwnership(
  resourceType: string,
  getResourceId: (request: FastifyRequest) => string,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // First ensure user is authenticated
    await requireAuth(request, reply);

    const user = (request as any).user;
    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    // Super admins bypass ownership checks (with audit trail)
    if (user.role === "super_admin") {
      logSensitiveOperation(
        user.userId, "ownership_bypass", resourceType, "super_admin_bypass",
        request.ip, request.headers["user-agent"] || "unknown", true,
        { bypass: "super_admin", resourceType },
      ).catch(() => { });
      return;
    }

    const resourceId = getResourceId(request);

    // Check ownership based on resource type
    let isOwner = false;

    switch (resourceType) {
      case "workspace": {
        const workspace = await prisma.workspace.findUnique({
          where: { id: resourceId },
          select: { ownerId: true },
        });
        isOwner = workspace?.ownerId === user.userId;
        break;
      }

      case "job": {
        const job = await prisma.job.findUnique({
          where: { id: resourceId },
          select: { creatorId: true },
        });
        isOwner = job?.creatorId === user.userId;
        break;
      }

      // Add more resource types as needed

      default:
        return reply.code(400).send({
          error: "Invalid Resource Type",
          message: `Unknown resource type: ${resourceType}`,
        });
    }

    if (!isOwner) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "You do not own this resource",
      });
    }
  };
}

/**
 * Require email verification
 */
export async function requireVerifiedEmail(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await requireAuth(request, reply);

  const user = (request as any).user;
  if (!user) return;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { emailVerified: true },
  });

  if (!dbUser?.emailVerified) {
    return reply.code(403).send({
      error: "Email Not Verified",
      message: "Please verify your email address to access this resource",
    });
  }
}

/**
 * Require completed profile
 */
export async function requireCompleteProfile(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await requireAuth(request, reply);

  const user = (request as any).user;
  if (!user) return;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { profileCompleted: true },
  });

  if (!dbUser?.profileCompleted) {
    return reply.code(403).send({
      error: "Profile Incomplete",
      message: "Please complete your profile to access this resource",
      redirectTo: "/onboarding/profile",
    });
  }
}
