import { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { emailService } from "../../services/infra/emailService";
import { prisma } from "../../services/infra/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import { requireAuth, requireCsrf } from "../../middleware/auth";
import {
  createSession,
  getSession,
  revokeSession,
  revokeAllUserSessions,
} from "../../services/auth/session";
import { firebaseAdmin, isFirebaseConfigured } from "../../services/infra/firebase";
import {
  logLoginAttempt,
  checkSuspiciousActivity,
  logSensitiveOperation,
} from "../../services/activity/auditLogger";
import { rateLimitConfig, loginKeyGenerator, passwordResetKeyGenerator } from "../../middleware/rateLimit";
import {
  AppError,
  BadRequest,
  Conflict,
  InternalError,
  Forbidden,
} from "../../utils/AppError";

// Shared prisma instance

export async function authRoutes(fastify: FastifyInstance) {
  // Health Check
  fastify.get("/auth/health", async () => ({ status: "ok" }));

  // Register with email/password
  fastify.post(
    "/auth/register",
    {
      config: { rateLimit: rateLimitConfig.register },
      schema: {
        body: {
          type: "object",
          required: ["email", "password", "name", "username"],
          properties: {
            email: { type: "string", maxLength: 255 },
            password: { type: "string", minLength: 8, maxLength: 128 },
            name: { type: "string", maxLength: 100 },
            username: { type: "string", maxLength: 39, pattern: "^[a-zA-Z0-9_-]+$" },
            country: { type: "string", maxLength: 100 },
            emailPreferences: { type: "boolean" },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, username, country, emailPreferences } = request.body as {
        email: string; password: string; name: string; username: string; country?: string; emailPreferences?: boolean;
      };

      try {
        // 1. Strict Input Validation
        if (!email || !password || !name || !username) {
          throw BadRequest("Missing required fields");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw BadRequest("Invalid email format");
        }

        if (password.length < 8) {
          throw BadRequest("Password must be at least 8 characters");
        }

        // 2. Register user with Firebase (Optional)
        let firebaseUid: string | undefined;

        if (isFirebaseConfigured) {
          try {
            const firebaseUser = await firebaseAdmin.auth().createUser({
              email,
              password,
              displayName: name,
            });
            firebaseUid = firebaseUser.uid;
            console.log(`✅ [AUTH] Firebase user created: ${firebaseUid}`);
          } catch (fbErr: any) {
            if (fbErr.code === "auth/email-already-exists") {
              throw Conflict("Email already registered in Firebase");
            }
            console.error("❌ [AUTH] Firebase registration failed (continuing with local only):", fbErr.message);
          }
        } else {
          console.log("ℹ️ [AUTH] Firebase not configured, skipping cloud registration.");
        }

        const userId = firebaseUid || crypto.randomUUID();

        // 3. Create user in our database (with Saga Pattern)
        const hashedPassword = await bcrypt.hash(password, 12);
        let newUser;

        try {
          const result = await prisma.$transaction([
            prisma.user.create({
              data: {
                id: userId,
                email,
                username,
                name: name || username,
                password: hashedPassword,
                role: "user",
                country: country || null,
                countryRef: (country && country.length === 2) ? {
                  connectOrCreate: {
                    where: { code: country },
                    create: { code: country, name: country }
                  }
                } : undefined,
                emailPreferences: emailPreferences !== undefined ? emailPreferences : true,
                settings: {
                  create: {
                    emailPreferences: emailPreferences !== undefined ? emailPreferences : true,
                  }
                },
                verification: {
                  create: {} // Setup default verification state
                }
              },
            }),
            prisma.outboxEvent.create({
              data: {
                topic: "user",
                payload: {
                  id: userId,
                  email,
                  username,
                  name: name || username,
                  role: "user",
                  country: country || null,
                  emailPreferences: emailPreferences !== undefined ? emailPreferences : true,
                }
              }
            })
          ]);
          newUser = result[0];
        } catch (dbError: any) {
          // Compensating Transaction (Saga): Rollback Firebase user if DB insert fails
          console.error("Database registration failed (Prisma Transaction), rolling back if needed:", dbError);
          if (userId && isFirebaseConfigured) {
            await firebaseAdmin.auth().deleteUser(userId).catch(console.error);
          }
          throw BadRequest("Database error during user creation. Please try again or choose a different username.");
        }

        // 3.5 Send verification email via Resend (Optional)
        if (isFirebaseConfigured) {
          try {
            const verificationLink = await firebaseAdmin.auth().generateEmailVerificationLink(email);
            await emailService.sendVerificationEmail(email, verificationLink);
          } catch (emailErr: any) {
            console.error("Failed to send verification email:", emailErr);
            request.log.error({ msg: "Email Verification Dispatch Failed", detail: emailErr.message });
          }
        }

        // 4. Create Session
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: userId,
            email: email,
            username: username,
            name: name || username,
            role: "user",
            tokenVersion: 1,
          },
          {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] || "unknown",
          },
        );

        // 5. Set Cookie - Session stability refined for Render/Production

        // 5. Set Cookie
        const isProduction = process.env.NODE_ENV === "production";
        reply.cookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction || request.headers["x-forwarded-proto"] === "https",
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        // 6. Audit Log
        await logLoginAttempt(
          email,
          request.ip,
          request.headers["user-agent"] || "unknown",
          true,
          firebaseUid,
        );

        return {
          message: "Registration successful",
          csrfToken,
          user: {
            id: userId,
            email,
            username,
            name: name || username,
            role: "user",
          },
        };
      } catch (error: any) {
        request.log.error(error);
        if (error instanceof Error) {
          try {
            fs.writeFileSync(
              "backend_register_error.log",
              error.name + ": " + error.message + "\n" + error.stack,
            );
          } catch (e) {
            console.error("Failed to write log", e);
          }
        }

        // Handle Prisma Unique Constraint Violation
        if (error.code === "P2002") {
          throw Conflict("User already exists (Email or Username taken)");
        }
        throw error; // Let global handler manage it
      }
    },
  );


  // Get Current User (Session Check)
  fastify.get("/auth/me", async (request, reply) => {
    try {
      let sessionId = request.cookies.session_id;
      if (!sessionId && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          sessionId = authHeader.substring(7);
        }
      }

      if (!sessionId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const session = await getSession(sessionId);

      if (!session) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      // Check for locked account
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { accountLocked: true },
      });

      if (user?.accountLocked) {
        return reply.code(403).send({ error: "Account Locked" });
      }

      return {
        user: {
          id: session.userId,
          email: session.email,
          username: session.username,
          name: session.name,
          avatar: session.avatar,
          role: session.role,
          workspaceId: session.workspaceId,
        },
        csrfToken: session.csrfToken,
      };
    } catch (error) {
      request.log.error(error);
      const sessionId = request.cookies.session_id;
      if (sessionId) {
        reply.clearCookie("session_id", { path: "/" });
      }
      return reply.code(401).send({ error: "Session invalid" });
    }
  });

  // Login with email/password
  fastify.post(
    "/auth/login",
    {
      config: { rateLimit: { ...rateLimitConfig.login, keyGenerator: loginKeyGenerator } },
      schema: {
        body: {
          type: "object",
          required: ["password"],
          properties: {
            email: { type: "string", maxLength: 255 },
            username: { type: "string", maxLength: 39 },
            password: { type: "string", minLength: 1, maxLength: 128 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { email, password, username } = request.body as {
        email?: string; password: string; username?: string;
      };
      const ip = request.ip;
      const userAgent = request.headers["user-agent"] || "unknown";

      try {
        // Accept either email or username
        const identifier = email || username || "";

        // 1. Check Suspicious Activity
        if (process.env.NODE_ENV === "production") {
          const securityCheck = await checkSuspiciousActivity(identifier, ip);
          if (securityCheck.shouldLock) {
            await logSensitiveOperation(
              "system",
              "block_login",
              "auth",
              identifier,
              ip,
              userAgent,
              true,
              { reason: securityCheck.reason },
            );
            throw Forbidden(
              "Account Locked: " +
              (securityCheck.reason || "Too many failed attempts"),
            );
          }
        }

        if (!identifier || !password) {
          throw BadRequest("Email/Username and password required");
        }

        // 2. Find user by email OR username, validate password with bcrypt
        let dbUser;
        if (identifier.includes("@")) {
          dbUser = await prisma.user.findUnique({
            where: { email: identifier },
          });
        } else {
          dbUser = await prisma.user.findUnique({
            where: { username: identifier },
          });
        }

        if (!dbUser || !dbUser.password) {
          await logLoginAttempt(
            identifier,
            ip,
            userAgent,
            false,
            undefined,
            "user_not_found",
          );
          return reply.code(401).send({ error: "Invalid credentials" });
        }

        const passwordValid = await bcrypt.compare(password, dbUser.password);
        if (!passwordValid) {
          await logLoginAttempt(
            identifier,
            ip,
            userAgent,
            false,
            undefined,
            "invalid_password",
          );
          return reply.code(401).send({ error: "Invalid credentials" });
        }

        const user = dbUser;

        // 3. Create Secure Session
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: user.id,
            email: user.email,
            username: user.username as string,
            name: user.name as string,
            role: user.role,
            tokenVersion: user.tokenVersion,
          },
          {
            ipAddress: ip,
            userAgent,
          },
        );

        // 4. Set HttpOnly Cookie - Session stability refined for Render/Production

        const isProduction = process.env.NODE_ENV === "production";
        reply.cookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction || request.headers["x-forwarded-proto"] === "https",
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // 5. Audit Log
        await logLoginAttempt(identifier, ip, userAgent, true, user.id);

        return {
          message: "Login successful",
          csrfToken,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
        };
      } catch (error: any) {
        request.log.error(error);
        if (error instanceof AppError) throw error;
        throw error; // Global handler will catch this
      }
    },
  );

  // Google OAuth callback
  fastify.post(
    "/auth/google",
    {
      config: { rateLimit: rateLimitConfig.oauth },
    },
    async (request, reply) => {
      const { code } = request.body as {
        code: string;
      };
      const ip = request.ip;
      const userAgent = request.headers["user-agent"] || "unknown";

      if (!code) {
        throw BadRequest("Authorization code required");
      }

      try {
        if (!code) {
          throw BadRequest("Authorization code required");
        }

        // 1. Verify the Firebase ID token from the frontend
        const idToken = (request.body as any)?.idToken || code;

        let firebaseUser;
        try {
          const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
          firebaseUser = await firebaseAdmin.auth().getUser(decodedToken.uid);
        } catch {
          throw BadRequest("Google OAuth verification failed");
        }

        // 2. Fetch/Sync user from our database
        let user = await prisma.user.findUnique({
          where: { id: firebaseUser.uid },
        });

        if (!user) {
          // Auto-create user from Firebase OAuth data
          const [newUser] = await prisma.$transaction([
            prisma.user.create({
              data: {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "",
                username: (firebaseUser.email || "").split("@")[0],
                password: "", // OAuth users have no password
                role: "user",
              },
            }),
            prisma.outboxEvent.create({
              data: {
                topic: "user",
                payload: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name: firebaseUser.displayName || "",
                  username: (firebaseUser.email || "").split("@")[0],
                  role: "user",
                }
              }
            })
          ]);
          user = newUser;
        }

        // 3. Create Secure Session
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: user.id,
            email: user.email,
            username: user.username as string,
            name: user.name as string,
            role: user.role,
            tokenVersion: user.tokenVersion,
          },
          { ipAddress: ip, userAgent },
        );

        const isProduction = process.env.NODE_ENV === "production";
        reply.cookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction || request.headers["x-forwarded-proto"] === "https",
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          message: "OAuth login successful",
          csrfToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
          },
        };
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        // Log the REAL error so we can diagnose it
        const realMessage = error?.message || String(error);
        request.log.error({ msg: "Google OAuth failed", error: realMessage });
        console.error("[AUTH/GOOGLE] REAL ERROR:", realMessage);

        // Log real error server-side but don't expose details to client
        if (realMessage.includes("Google token exchange failed") || realMessage.includes("redirect_uri_mismatch")) {
          request.log.error({ msg: "Google OAuth config error", detail: realMessage });
        }

        return reply.code(400).send({ error: "Google login failed" });
      }
    },
  );

  // GitHub OAuth callback
  fastify.post(
    "/auth/github",
    {
      config: { rateLimit: rateLimitConfig.oauth },
    },
    async (request, reply) => {
      const { code } = request.body as {
        code: string;
      };
      const ip = request.ip;
      const userAgent = request.headers["user-agent"] || "unknown";

      try {
        if (!code) throw BadRequest("Authorization code required");

        // 1. Verify the Firebase ID token from the frontend
        const idToken = (request.body as any)?.idToken || code;

        let firebaseUser;
        try {
          const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
          firebaseUser = await firebaseAdmin.auth().getUser(decodedToken.uid);
        } catch {
          throw BadRequest("GitHub OAuth verification failed");
        }

        // 2. Sync with database
        let user = await prisma.user.findUnique({
          where: { id: firebaseUser.uid },
        });

        if (!user) {
          // Auto-create user from Firebase OAuth data
          const [newUser] = await prisma.$transaction([
            prisma.user.create({
              data: {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || "",
                username: (firebaseUser.email || "").split("@")[0],
                password: "",
                role: "user",
              },
            }),
            prisma.outboxEvent.create({
              data: {
                topic: "user",
                payload: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  name: firebaseUser.displayName || "",
                  username: (firebaseUser.email || "").split("@")[0],
                  role: "user",
                }
              }
            })
          ]);
          user = newUser;
        }

        // 3. Create Session
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: user.id,
            email: user.email,
            role: user.role,
            username: user.username as string,
            name: user.name as string,
            tokenVersion: user.tokenVersion,
          },
          { ipAddress: ip, userAgent },
        );

        const isProduction = process.env.NODE_ENV === "production";
        reply.cookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction || request.headers["x-forwarded-proto"] === "https",
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          message: "OAuth login successful",
          csrfToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
          },
        };
      } catch (error: any) {
        if (error instanceof AppError) throw error;
        request.log.error(error);
        throw InternalError("GitHub login failed");
      }
    },
  );

  // Logout
  fastify.post(
    "/auth/logout",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      let sessionId = request.cookies.session_id;
      if (!sessionId && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          sessionId = authHeader.substring(7);
        }
      }

      if (sessionId) {
        await revokeSession(sessionId);
        const isProduction = process.env.NODE_ENV === "production";
        reply.clearCookie("session_id", {
          path: "/",
        });

        // Log logout
        const user = (request as any).user;
        await logLoginAttempt(
          user.email,
          request.ip,
          request.headers["user-agent"] || "unknown",
          true,
          user.userId,
          "logout",
        );
      }
      return { message: "Logged out successfully" };
    },
  );

  // Global Logout (Invalidate ALL sessions)
  fastify.post(
    "/auth/logout-everywhere",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      const user = (request as any).user;

      try {
        // Increment token version to invalidate all past sessions
        await prisma.user.update({
          where: { id: user.userId },
          data: { tokenVersion: { increment: 1 } },
        });

        // Also revoke physical session records for good measure
        await revokeAllUserSessions(user.userId);

        const isProduction = process.env.NODE_ENV === "production";
        reply.clearCookie("session_id", {
          path: "/",
        });
        return { message: "Logged out from all devices successfully" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // --- Email Verification ---
  fastify.post(
    "/auth/verify-email/request",
    {
      preHandler: [requireAuth, requireCsrf],
      config: { rateLimit: rateLimitConfig.verifyEmail },
    },
    async (request: any) => {
      const user = request.user;

      try {
        // Generate email verification link via Firebase Admin
        const verificationLink = await firebaseAdmin.auth().generateEmailVerificationLink(user.email);

        // Send verification email via Resend
        await emailService.sendVerificationEmail(user.email, verificationLink);

        request.log.info(`Verification email sent to ${user.email} via Resend`);

        return { message: "Verification email sent" };
      } catch (error: any) {
        request.log.error(error);
        throw error;
      }
    },
  );

  fastify.post("/auth/verify-email/confirm", async (request, reply) => {
    const { token, email } = request.body as { token: string; email: string };

    if (!token || !email) {
      throw BadRequest("Token and email required");
    }

    try {
      // With Firebase, email verification is handled by Firebase's email link.
      // This endpoint can be used to manually mark a user as verified.
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        throw BadRequest("User not found");
      }

      // Mark verified in our database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      return { message: "Email verified successfully" };
    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  // --- Password Reset ---
  fastify.post(
    "/auth/password-reset/request",
    {
      config: { rateLimit: { ...rateLimitConfig.passwordReset, keyGenerator: passwordResetKeyGenerator } },
    },
    async (request) => {
      const { email } = request.body as { email: string };

      if (!email) throw BadRequest("Email required");

      try {
        let resetLink: string | undefined;
        
        if (isFirebaseConfigured) {
          // Use Firebase Admin to generate password reset link
          const actionCodeSettings = {
            url: `${env.FRONTEND_URL}/reset-password`,
            handleCodeInApp: true,
          };
          resetLink = await firebaseAdmin.auth().generatePasswordResetLink(email, actionCodeSettings);
        } else {
          // Fallback: Local reset link (if implemented) or just log
          console.warn("⚠️ [AUTH] Firebase not configured, skipping Firebase password reset link generation.");
          resetLink = `${env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&mock=true`;
        }

        // Fetch user from DB to get username
        const user = await prisma.user.findUnique({
          where: { email },
          select: { username: true }
        });

        // Send password reset email via Resend with username
        await emailService.sendPasswordResetEmail(email, resetLink, user?.username || undefined);

        // Always return success to prevent email enumeration
        return { message: "If an account exists, a password reset email has been sent" };
      } catch (error: any) {
        request.log.error(error);
        // Still return success to prevent enumeration
        return { message: "If an account exists, a password reset email has been sent" };
      }
    });

  fastify.post("/auth/password-reset/confirm", async (request, reply) => {
    const { token, password, email } = request.body as {
      token: string;
      password: string;
      email: string;
    };

    if (!token || !password) {
      throw BadRequest("Token and new password required");
    }

    if (password.length < 8) {
      throw BadRequest("Password must be at least 8 characters");
    }

    try {
      // With Firebase, password reset confirmation is handled on the frontend
      // via confirmPasswordReset(auth, oobCode, newPassword).
      // This backend endpoint can be used as a fallback.

      // Find user by email and update password
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw BadRequest("User not found");
      }

      // Update password in Firebase
      if (isFirebaseConfigured) {
        await firebaseAdmin.auth().updateUser(user.id, { password });
      }

      // Update password hash in Prisma
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: "Password reset successful" };
    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  // --- Profile Completion ---
  fastify.post(
    "/auth/profile/complete",
    {
      preHandler: [requireAuth, requireCsrf],
      schema: {
        body: {
          type: "object",
          required: ["username", "name"],
          properties: {
            username: { type: "string", maxLength: 39, pattern: "^[a-zA-Z0-9_-]+$" },
            name: { type: "string", maxLength: 100 },
            bio: { type: "string", maxLength: 500 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { username, name, bio } = request.body as {
        username: string; name: string; bio?: string;
      };
      const user = (request as any).user;

      try {
        const updatedUser = await prisma.user.update({
          where: { id: user.userId },
          data: {
            username,
            name,
            profileCompleted: true,
            // In a real app, storing bio/role would likely be in a Profile relation
            // For now updating core user if fields exist or ignoring
          },
        });
        return { message: "Profile updated", user: updatedUser };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to update profile" });
      }
    },
  );

  // --- Session Management ---

  // Get active sessions
  fastify.get(
    "/auth/sessions",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      const currentSessionId = request.cookies.session_id;

      try {
        const sessions = await prisma.session.findMany({
          where: {
            userId: user.userId,
            revokedAt: null,
            expiresAt: { gte: new Date() },
          },
          orderBy: { lastActivityAt: "desc" },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            lastActivityAt: true,
            sessionId: true, // Need this to identify current session
          },
        });

        // Map to hide internal IDs and flag current session
        return sessions.map((s) => ({
          id: s.sessionId, // Use public session ID
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          lastActivityAt: s.lastActivityAt,
          isCurrent: s.sessionId === currentSessionId,
        }));
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // Revoke specific session
  fastify.delete(
    "/auth/sessions/:sessionId",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      const user = (request as any).user;

      try {
        // Verify ownership
        const session = await prisma.session.findUnique({
          where: { sessionId },
        });

        if (!session || session.userId !== user.userId) {
          return reply.code(404).send({ error: "Session not found" });
        }

        await revokeSession(sessionId);
        return { message: "Session revoked" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // Revoke all other sessions
  fastify.delete(
    "/auth/sessions",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      const user = (request as any).user;
      const currentSessionId = request.cookies.session_id;

      try {
        await prisma.session.updateMany({
          where: {
            userId: user.userId,
            sessionId: { not: currentSessionId }, // Keep current
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
        return { message: "All other sessions revoked" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // --- Audit Logs ---
  fastify.get(
    "/auth/audit-logs",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      try {
        // Fetch login attempts (since that's what the UI expects for now)
        // Ideally we'd merge ActivityLog and LoginAttempt or use just ActivityLog
        const logs = await prisma.loginAttempt.findMany({
          where: {
            userId: user.userId,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        return logs.map((l) => ({
          id: l.id,
          action: l.success ? "login_success" : "login_failed",
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          success: l.success,
          createdAt: l.createdAt,
          details: { reason: l.failureReason },
        }));
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // --- Linked Accounts ---
  fastify.get(
    "/auth/connections",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      try {
        const accounts = await prisma.oAuthAccount.findMany({
          where: { userId: user.userId },
          select: { provider: true },
        });

        return {
          google: accounts.some((a) => a.provider === "google"),
          github: accounts.some((a) => a.provider === "github"),
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  fastify.delete(
    "/auth/connections/:provider",
    { preHandler: [requireAuth, requireCsrf] },
    async (request, reply) => {
      const { provider } = request.params as { provider: string };
      const user = (request as any).user;

      try {
        // Prevent unlinking if it's the only method (simplified check)
        // Ideally check if password exists or other providers exist
        const connectionCount = await prisma.oAuthAccount.count({
          where: { userId: user.userId },
        });

        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { password: true },
        });

        if (connectionCount <= 1 && !dbUser?.password) {
          return reply
            .code(400)
            .send({ error: "Cannot unlink last sign-in method" });
        }

        await prisma.oAuthAccount.deleteMany({
          where: {
            userId: user.userId,
            provider,
          },
        });

        return { message: "Account unlinked" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // --- Account Deletion ---
  fastify.delete(
    "/auth/account",
    {
      preHandler: [requireAuth, requireCsrf],
      schema: {
        body: {
          type: "object",
          required: ["confirmation"],
          properties: {
            password: { type: "string", maxLength: 128 },
            confirmation: { type: "string", enum: ["DELETE"] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { password, confirmation } = request.body as {
        password?: string; confirmation: string;
      };
      const user = (request as any).user;

      if (confirmation !== "DELETE") {
        return reply.code(400).send({ error: "Invalid confirmation code" });
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.userId },
        });

        if (!dbUser) {
          return reply.code(404).send({ error: "User not found" });
        }

        // Verify password if user has one
        if (dbUser.password) {
          if (!password) {
            return reply.code(400).send({ error: "Password required" });
          }
          const isValid = await bcrypt.compare(password, dbUser.password);
          if (!isValid) {
            return reply.code(401).send({ error: "Invalid password" });
          }
        }

        // Soft delete user
        await prisma.user.update({
          where: { id: user.userId },
          data: {
            deletedAt: new Date(),
            deleteScheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            email: `deleted_${Date.now()}_${dbUser.email}`, // Free up email immediately
            username: `deleted_${Date.now()}_${dbUser.username}`,
          },
        });

        // Revoke all sessions
        const currentSessionId = request.cookies.session_id;
        if (currentSessionId) {
          await revokeSession(currentSessionId); // Current
        }
        await prisma.session.updateMany({
          where: { userId: user.userId },
          data: { revokedAt: new Date() },
        });

        // Log it
        await logSensitiveOperation(
          user.userId,
          "delete_account",
          "user",
          user.userId,
          request.ip,
          request.headers["user-agent"] || "unknown",
          true,
        );

        reply.clearCookie("session_id", { path: "/" });
        return { message: "Account deleted successfully" };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // Synchronize Firebase User with PostgreSQL
  fastify.post(
    "/auth/sync",
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;
      const ip = request.ip;
      const userAgent = request.headers["user-agent"] || "unknown";

      try {
        let dbUser = await prisma.user.findUnique({
          where: { id: user.userId }
        });

        // 1. If user doesn't exist, we must fetch their full details from Firebase to seed the DB
        if (!dbUser) {
          let email = user.email || "";
          let name = "TrackCodex User";

          if (isFirebaseConfigured) {
            try {
              // We can fetch the real data from Firebase Admin Since we only have the UID
              const fbUser = await firebaseAdmin.auth().getUser(user.userId);
              email = fbUser.email || "";
              name = fbUser.displayName || name;
            } catch (e) {
              request.log.warn({ uid: user.userId }, "Failed to fetch full firebase user profile during sync");
            }
          }

          const username = email ? email.split("@")[0] : `user_${user.userId.substring(0, 8)}`;

          dbUser = await prisma.user.upsert({
            where: { id: user.userId },
            update: {
              email: email,
              name: name,
              username: username,
            },
            create: {
              id: user.userId,
              email: email,
              username: username,
              name: name,
              password: "", // Handled by Firebase
              role: user.role || "user",
            }
          });

          await prisma.outboxEvent.create({
            data: {
              topic: "user",
              payload: {
                id: user.userId,
                email: email,
                username: username,
                name: name,
                role: dbUser.role,
              }
            }
          });
        }

        // 2. Create the Backend Session identical to Login flow
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: dbUser.id,
            email: dbUser.email,
            username: dbUser.username as string,
            name: dbUser.name as string,
            role: dbUser.role,
            tokenVersion: dbUser.tokenVersion,
          },
          { ipAddress: ip, userAgent },
        );

        // 3. Set the Cookie
        const isProduction = process.env.NODE_ENV === "production";
        reply.cookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction || request.headers["x-forwarded-proto"] === "https",
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          success: true,
          csrfToken,
          user: {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role
          }
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to sync user" });
      }
    }
  );

  // --- Desktop App Deep Link Bridge ---
  fastify.get(
    "/auth/desktop-redirect",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const uid = user.userId;

        // Generate a Firebase Custom Token
        let customToken = "dummy-local-token";
        if (isFirebaseConfigured) {
          customToken = await firebaseAdmin.auth().createCustomToken(uid);
        }

        // Redirect the user back to the Desktop App via the custom protocol
        const deepLinkUrl = `trackcodex://auth?token=${customToken}`;

        // Tell the browser to open TrackCodex desktop application
        return reply.redirect(deepLinkUrl);
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Internal Server Error during desktop handoff" });
      }
    }
  );

  // --- ORCID OAuth (Mocked for Demo) ---
  fastify.get("/auth/orcid", async (request, reply) => {
    const mockCode = "mock_auth_code_123";
    return reply.redirect(`${env.BACKEND_URL || ""}/api/v1/auth/orcid/callback?code=${mockCode}`);
  });

  fastify.get("/auth/orcid/callback", async (request, reply) => {
    const mockOrcidId = "0000-0002-1825-0097";
    return reply.redirect(`${env.FRONTEND_URL || "https://trackcodex.com"}/settings/profile?orcid_id=${mockOrcidId}`);
  });
}




