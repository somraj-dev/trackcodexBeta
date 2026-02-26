import { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import {
  createSession,
  getSession,
  revokeSession,
  revokeAllUserSessions,
} from "../services/session";
import { supabaseAdmin } from "../services/supabase";
import {
  logLoginAttempt,
  checkSuspiciousActivity,
  logSensitiveOperation,
} from "../services/auditLogger";
import { rateLimitConfig } from "../middleware/rateLimit";
import {
  AppError,
  BadRequest,
  Unauthorized,
  Conflict,
  InternalError,
  NotFound,
  Forbidden,
} from "../utils/AppError";

// Shared prisma instance

export async function authRoutes(fastify: FastifyInstance) {
  // Health Check
  fastify.get("/auth/health", async () => ({ status: "ok" }));

  // Register with email/password
  fastify.post(
    "/auth/register",
    {
      config: { rateLimit: rateLimitConfig.register },
    },
    async (request, reply) => {
      const { email, password, name, username } = request.body as any;

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

        // 2. Register user with Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              username: username,
            },
          },
        });

        if (authError) {
          throw BadRequest(authError.message);
        }

        if (!authData.user) {
          throw InternalError("Failed to create user in Supabase");
        }

        const user = authData.user;

        // 3. The SQL trigger handle_new_user() will create the entry in public."User"
        // We might need to wait a moment or just trust the trigger.
        // For registration response, we return what we have.

        // 4. Create Session
        const sessionId = crypto.randomUUID();
        const { csrfToken } = await createSession(
          sessionId,
          {
            userId: user.id,
            email: user.email!,
            username: (user.user_metadata?.username as string) || "",
            name: (user.user_metadata?.full_name as string) || "",
            role: "user",
            tokenVersion: 1,
          },
          {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] || "unknown",
          },
        );

        // Determine the domain dynamically
        let cookieDomain: string | undefined = undefined;
        if (process.env.FRONTEND_URL) {
          try {
            const urlObj = new URL(process.env.FRONTEND_URL);
            const hostParts = urlObj.hostname.split('.');
            if (hostParts.length >= 2) cookieDomain = '.' + hostParts.slice(-2).join('.');
          } catch (e) { }
        }

        // 5. Set Cookie
        const isProduction = process.env.NODE_ENV === "production";
        reply.setCookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          domain: isProduction ? cookieDomain : undefined,
          maxAge: 7 * 24 * 60 * 60,
        });

        // 6. Audit Log
        await logLoginAttempt(
          email,
          request.ip,
          request.headers["user-agent"] || "unknown",
          true,
          user.id,
        );

        return {
          message: "Registration successful",
          csrfToken,
          sessionId,
          user: {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username,
            name: user.user_metadata?.full_name,
            avatar: user.user_metadata?.avatar_url,
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

  // DEV ONLY: Bypass Login
  if (process.env.NODE_ENV !== "production") {
    fastify.post("/auth/dev-login", async (request, reply) => {
      try {
        // Atomic "Find or Create" logic using transaction not strictly needed here if we handle races,
        // but for dev login, simple is fine. We just want reliability.
        let user = await prisma.user.findFirst();

        if (!user) {
          try {
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.hash("password123", 10);
            user = await prisma.user.create({
              data: {
                email: "dev@trackcodex.dev",
                username: "devuser",
                name: "Developer",
                password: hashedPassword,
                role: "user",
                profileCompleted: true,
              },
            });
          } catch (createError) {
            // Race condition: User created by another request moments ago
            user = await prisma.user.findFirst();
            if (!user) throw createError; // Genuine failure
          }
        }

        if (!user) throw new Error("Failed to find or create dev user");

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
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"] || "unknown",
          },
        );

        let cookieDomain: string | undefined = undefined;
        if (process.env.FRONTEND_URL) {
          try {
            const urlObj = new URL(process.env.FRONTEND_URL);
            const hostParts = urlObj.hostname.split('.');
            if (hostParts.length >= 2) cookieDomain = '.' + hostParts.slice(-2).join('.');
          } catch (e) { }
        }

        const isProduction = process.env.NODE_ENV === "production";
        reply.setCookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          domain: isProduction ? cookieDomain : undefined,
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          message: "Dev login successful",
          csrfToken,
          sessionId,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
        };
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Dev login failed" });
      }
    });
  }

  // Get Current User (Session Check)
  fastify.get("/auth/me", async (request, reply) => {
    try {
      console.log("DEBUG: /me called");
      let sessionId = request.cookies.session_id;
      if (!sessionId && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          sessionId = authHeader.substring(7);
        }
      }
      console.log("DEBUG: Session ID from cookie/header:", sessionId);

      if (!sessionId) {
        console.log("DEBUG: No session ID");
        return reply.code(401).send({ error: "Unauthorized" });
      }

      console.log("DEBUG: Calling getSession");
      const session = await getSession(sessionId);
      console.log("DEBUG: getSession result:", session ? "Found" : "Null");

      if (!session) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      // Check for locked account
      console.log("DEBUG: Checking user lock status");
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { accountLocked: true },
      });

      if (user?.accountLocked) {
        console.log("DEBUG: Account is locked");
        return reply.code(403).send({ error: "Account Locked" });
      }

      console.log("DEBUG: Returning user data");
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
      console.error("DEBUG: /me CRASH:", error);
      request.log.error(error);
      const sessionId = request.cookies.session_id;
      // Fallback: Clear cookie if invalid
      if (sessionId) {
        reply.clearCookie("session_id", { path: "/" });
      }
      return reply.code(401).send({ error: "Session invalid", debug: { sessionId: sessionId ? "present" : "missing" } }); // Return 401 instead of 500 to stop retry loop
    }
  });

  // Login with email/password
  fastify.post(
    "/auth/login",
    {
      config: { rateLimit: rateLimitConfig.login },
    },
    async (request, reply) => {
      const { email, password, username } = request.body as any;
      const ip = request.ip;
      const userAgent = request.headers["user-agent"] || "unknown";

      try {
        // Accept either email or username
        const identifier = email || username;

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

        // Find user by email OR username
        // 2. Validate Credentials with Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: identifier.includes("@") ? identifier : undefined,
          // If identifier is not an email, we might have a problem if Supabase doesn't support username login out of the box
          // Supabase supports email/password or phone/password.
          // For username login, we'd need to fetch the email from Prisma first.
          ...(identifier.includes("@") ? { email: identifier } : {}),
          password,
        });

        let finalAuthData = authData;
        let finalAuthError = authError;

        if (!identifier.includes("@")) {
          // Attempt to find user by username to get email
          const dbUser = await prisma.user.findUnique({
            where: { username: identifier },
            select: { email: true }
          });
          if (dbUser) {
            const { data: retryData, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
              email: dbUser.email,
              password,
            });
            finalAuthData = retryData;
            finalAuthError = retryError;
          } else {
            return reply.code(401).send({ error: "Invalid credentials" });
          }
        }

        if (finalAuthError || !finalAuthData.user) {
          await logLoginAttempt(
            identifier,
            ip,
            userAgent,
            false,
            undefined,
            finalAuthError?.message || "invalid_credentials",
          );
          return reply.code(401).send({ error: finalAuthError?.message || "Invalid credentials" });
        }

        const user = await prisma.user.findUnique({
          where: { id: finalAuthData.user.id }
        });

        if (!user) {
          throw InternalError("User authenticated but not found in database");
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
          {
            ipAddress: ip,
            userAgent,
          },
        );

        // 4. Set HttpOnly Cookie
        const isProduction = process.env.NODE_ENV === "production";
        reply.setCookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          domain: isProduction ? cookieDomain : undefined,
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // 5. Audit Log
        await logLoginAttempt(identifier, ip, userAgent, true, user.id);

        return {
          message: "Login successful",
          csrfToken,
          sessionId,
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

      let cookieDomain: string | undefined = undefined;
      if (process.env.FRONTEND_URL) {
        try {
          const urlObj = new URL(process.env.FRONTEND_URL);
          const hostParts = urlObj.hostname.split('.');
          if (hostParts.length >= 2) {
            cookieDomain = '.' + hostParts.slice(-2).join('.');
          }
        } catch (e) { }
      }

      try {
        if (!code) {
          throw BadRequest("Authorization code required");
        }

        // 1. Exchange code for session with Supabase
        const { data: authData, error: authError } = await supabaseAdmin.auth.exchangeCodeForSession(code);

        if (authError || !authData.user) {
          throw BadRequest(authError?.message || "Google OAuth exchange failed");
        }

        const supabaseUser = authData.user;

        // 2. Fetch/Sync user from our database
        // The trigger handle_new_user should have already created the user
        const user = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
        });

        if (!user) {
          // Fallback in case trigger hasn't finished or failed
          // But ideally we just wait a bit or the trigger handles it.
          // For now, let's attempt a quick retry or just handle it.
          throw InternalError("User sync failed after Google OAuth");
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
        reply.setCookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          domain: isProduction ? cookieDomain : undefined,
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          message: "OAuth login successful",
          csrfToken,
          sessionId,
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

        // Provide clear feedback for missing or invalid Google credentials
        if (realMessage.includes("Google token exchange failed") || realMessage.includes("redirect_uri_mismatch")) {
          throw InternalError(
            "Server Configuration Error: Google token exchange failed. Please verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and REDIRECT_URI in the environment variables."
          );
        }

        // Return a clear 400 error with the real message instead of throwing an InternalError
        // This ensures the frontend receives the reason (e.g. redirect_uri_mismatch) instead of a generic 500
        return reply.code(400).send({ error: "Google login failed", detail: realMessage });
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

      let cookieDomain: string | undefined = undefined;
      if (process.env.FRONTEND_URL) {
        try {
          const urlObj = new URL(process.env.FRONTEND_URL);
          const hostParts = urlObj.hostname.split('.');
          if (hostParts.length >= 2) {
            cookieDomain = '.' + hostParts.slice(-2).join('.');
          }
        } catch {
          // Ignore parsing errors for domain
        }
      }

      try {
        if (!code) throw BadRequest("Authorization code required");

        // 1. Exchange code for session
        const { data: authData, error: authError } = await supabaseAdmin.auth.exchangeCodeForSession(code);

        if (authError || !authData.user) {
          throw BadRequest(authError?.message || "GitHub OAuth exchange failed");
        }

        const supabaseUser = authData.user;

        // 2. Sync with database
        const user = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
        });

        if (!user) {
          throw InternalError("User sync failed after GitHub OAuth");
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
        reply.setCookie("session_id", sessionId, {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          domain: isProduction ? cookieDomain : undefined,
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          message: "OAuth login successful",
          csrfToken,
          sessionId,
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
    { preHandler: requireAuth },
    async (request, reply) => {
      let sessionId = request.cookies.session_id;
      if (!sessionId && request.headers.authorization) {
        const authHeader = request.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          sessionId = authHeader.substring(7);
        }
      }

      if (sessionId) {
        let cookieDomain: string | undefined = undefined;
        if (process.env.FRONTEND_URL) {
          try {
            const urlObj = new URL(process.env.FRONTEND_URL);
            const hostParts = urlObj.hostname.split('.');
            if (hostParts.length >= 2) cookieDomain = '.' + hostParts.slice(-2).join('.');
          } catch (e) { }
        }

        await revokeSession(sessionId);
        const isProduction = process.env.NODE_ENV === "production";
        reply.clearCookie("session_id", {
          path: "/",
          domain: isProduction ? cookieDomain : undefined
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
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user;

      try {
        // Increment token version to invalidate all past sessions
        await prisma.user.update({
          where: { id: user.userId },
          data: { tokenVersion: { increment: 1 } },
        });

        let cookieDomain: string | undefined = undefined;
        if (process.env.FRONTEND_URL) {
          try {
            const urlObj = new URL(process.env.FRONTEND_URL);
            const hostParts = urlObj.hostname.split('.');
            if (hostParts.length >= 2) cookieDomain = '.' + hostParts.slice(-2).join('.');
          } catch (e) { }
        }

        // Also revoke physical session records for good measure
        await revokeAllUserSessions(user.userId);

        const isProduction = process.env.NODE_ENV === "production";
        reply.clearCookie("session_id", {
          path: "/",
          domain: isProduction ? cookieDomain : undefined
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
    { preHandler: requireAuth },
    async (request) => {
      const user = (request as any).user;

      try {
        const { error } = await supabaseAdmin.auth.resend({
          type: "signup",
          email: user.email,
        });

        if (error) {
          throw BadRequest(error.message);
        }

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
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) {
        throw BadRequest(error.message);
      }

      // Sync local DB (emailVerified)
      await prisma.user.update({
        where: { id: data.user?.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  // --- Password Reset ---
  fastify.post("/auth/password-reset/request", async (request) => {
    const { email } = request.body as { email: string };

    if (!email) throw BadRequest("Email required");

    try {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) throw BadRequest(error.message);

      return { message: "Password reset email sent" };
    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  fastify.post("/auth/password-reset/confirm", async (request, reply) => {
    const { token, password } = request.body as {
      token: string;
      password: string;
    };

    if (!token || !password) {
      throw BadRequest("Token and new password required");
    }

    try {
      // 1. Exchange token for session (Supabase use token in reset link)
      const { error: authError } = await supabaseAdmin.auth.verifyOtp({
        token,
        type: "recovery",
        email: (request.body as any).email, // Some flows need email
      });

      if (authError) throw BadRequest(authError.message);

      // 2. Update password
      const { error: updateError } = await supabaseAdmin.auth.updateUser({
        password,
      });

      if (updateError) throw BadRequest(updateError.message);

      return { message: "Password reset successful" };
    } catch (error: any) {
      request.log.error(error);
      throw error;
    }
  });

  // --- Profile Completion ---
  fastify.post(
    "/auth/profile/complete",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { username, name, bio, role } = request.body as any;
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
    { preHandler: requireAuth },
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
    { preHandler: requireAuth },
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
    { preHandler: requireAuth },
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
    { preHandler: requireAuth },
    async (request, reply) => {
      const { password, confirmation } = request.body as any;
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
  // --- ORCID OAuth (Mocked for Demo) ---
  fastify.get("/auth/orcid", async (request, reply) => {
    // In production, this would redirect to ORCID OAuth
    const mockCode = "mock_auth_code_123";
    return reply.redirect(`/api/v1/auth/orcid/callback?code=${mockCode}`);
  });

  fastify.get("/auth/orcid/callback", async (request, reply) => {
    const mockOrcidId = "0000-0002-1825-0097"; // Example valid format
    // Redirect back to frontend settings with the ID
    return reply.redirect(`http://localhost:5173/settings/profile?orcid_id=${mockOrcidId}`);
  });
}
