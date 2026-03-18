import { FastifyRequest, FastifyReply } from "fastify";
import { getSession } from "../services/auth/session";
import { prisma } from "../services/infra/prisma";
import { firebaseAdmin, isFirebaseConfigured } from "../services/infra/firebase";
import { logSensitiveOperation } from "../services/activity/auditLogger";

// Module-level cache for the dev bypass user (upsert runs once per process)
let devUserCache: { id: string; email: string; role: string } | null = null;

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
    // DEV MODE BYPASS: Auto-inject local dev user when no auth credentials exist
    if (process.env.NODE_ENV !== "production") {
      const devAuthHeader = request.headers.authorization;
      const devSessionId = request.cookies?.session_id;
      
      // Only bypass if there are NO auth credentials at all
      if (!devAuthHeader && !devSessionId) {
        // Cache the dev user so we only hit the DB once per process
        if (!devUserCache) {
          devUserCache = await prisma.user.upsert({
            where: { email: "dev@trackcodex.dev" },
            update: {},
            create: {
              id: "local-dev-user-1",
              email: "dev@trackcodex.dev",
              name: "Local Developer",
              username: "local-dev",
              role: "user",
            },
          });
        }

        (request as any).user = {
          userId: devUserCache.id,
          email: devUserCache.email,
          role: devUserCache.role,
        };
        return; // Skip all further auth checks in dev mode
      }
    }
    // 1. Try to get Firebase ID token from Authorization header
    const authHeader = request.headers.authorization;
    let firebaseUid: string | null = null;

    if (authHeader?.startsWith("Bearer ") && isFirebaseConfigured) {
      const token = authHeader.substring(7);
      // If it looks like a JWT (roughly 3 parts separated by dots)
      if (token.split(".").length === 3) {
        try {
          const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
          firebaseUid = decodedToken.uid;
        } catch {
          // Token verification failed — fall through to session auth
        }
      }
    }

    if (firebaseUid) {
      // Find user in our database to get full profile
      let dbUser = await prisma.user.findUnique({
        where: { id: firebaseUid },
        select: {
          id: true,
          email: true,
          role: true,
          tokenVersion: true,
        },
      });

      if (!dbUser) {
        // AUTO-SYNC: User is valid in Firebase but doesn't exist in DB yet.
        if (isFirebaseConfigured) {
          let fbEmail: string | undefined; // Hoisted so catch block can access it
          try {
            const fbUser = await firebaseAdmin.auth().getUser(firebaseUid);
            fbEmail = fbUser.email || undefined;
            const email = fbUser.email || "";
            const name = fbUser.displayName || "TrackCodex User";
            const username = fbUser.email ? fbUser.email.split("@")[0] : `user_${firebaseUid.substring(0, 8)}`;

            // Create the user in Postgres using upsert to handle race conditions
            dbUser = await prisma.user.upsert({
              where: { id: firebaseUid },
              update: {
                emailVerified: fbUser.emailVerified || false, // Sync latest status
              },
              create: {
                id: firebaseUid,
                email: email,
                username: username,
                name: name,
                password: "", // Handled by Firebase
                role: "user",
                emailVerified: fbUser.emailVerified || false,
              },
              select: {
                id: true,
                email: true,
                role: true,
                tokenVersion: true,
              }
            });
            console.log(`[AUTH-SYNC] Successfully auto-synced user record for ${firebaseUid}`);
          } catch (syncErr: any) {
            const isConnectionError = syncErr?.message?.includes("Can't reach database") ||
              syncErr?.message?.includes("connect") ||
              syncErr?.message?.includes("ECONNREFUSED") ||
              syncErr?.message?.includes("timeout") ||
              syncErr?.code === "P1001" || syncErr?.code === "P1002";

            const isUniqueConstraint = syncErr?.code === "P2002";

            console.error(`[AUTH-SYNC] Failed to auto-sync user ${firebaseUid}:`);
            console.error(`[AUTH-SYNC]   Error name: ${syncErr?.name}`);
            console.error(`[AUTH-SYNC]   Error code: ${syncErr?.code}`);
            console.error(`[AUTH-SYNC]   Error message: ${syncErr?.message}`);
            console.error(`[AUTH-SYNC]   Is connection error: ${isConnectionError}`);
            console.error(`[AUTH-SYNC]   Is unique constraint: ${isUniqueConstraint}`);

            // If the upsert failed due to a unique constraint (e.g. email/username already taken by another row),
            // try to find the existing user by email and link them instead of rejecting.
            if (isUniqueConstraint && fbEmail) {
              try {
                const existingUser = await prisma.user.findFirst({
                  where: {
                    OR: [
                      { email: fbEmail },
                      { id: firebaseUid },
                    ],
                  },
                  select: { id: true, email: true, role: true, tokenVersion: true },
                });

                if (existingUser) {
                  console.log(`[AUTH-SYNC] Found existing user by email fallback: ${existingUser.id}`);
                  dbUser = existingUser;
                }
              } catch (fallbackErr) {
                console.error(`[AUTH-SYNC] Fallback lookup also failed:`, fallbackErr);
              }
            }

            // If we still don't have a user, return appropriate error
            if (!dbUser) {
              const userMessage = isConnectionError
                ? "Database is temporarily unavailable. Please try again in a moment."
                : "User synchronization failed. Please sign in again.";

              return reply.code(isConnectionError ? 503 : 401).send({
                error: isConnectionError ? "Service Unavailable" : "Unauthorized",
                message: userMessage,
              });
            }
          }
        }
      }

      if (dbUser) {
        (request as any).user = {
          userId: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        };
        return; // Success with Firebase JWT
      } else {
        // Should be unreachable due to previous check, but safer to reject
        return reply.code(401).send({
          error: "Unauthorized",
          message: "User record not found in database",
        });
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
    // Fix #8: Read role FRESH from DB, not cached session (prevents 7-day stale role)
    const freshUser = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { role: true },
    });

    if (!freshUser) {
      // If session exists but user record is gone, reject
      console.error(`[AUTH] Session ${sessionId} found but User ${sessionData.userId} MISSING from DB.`);
      reply.clearCookie("session_id");
      return reply.code(401).send({
        error: "Unauthorized",
        message: "User account no longer exists.",
      });
    }

    (request as Record<string, any>).user = {
      userId: sessionData.userId,
      email: sessionData.email,
      role: freshUser.role,
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



