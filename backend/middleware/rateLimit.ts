/**
 * Rate Limiting Configuration
 * Defines rate limits for different authentication endpoints
 */

import { FastifyRequest, FastifyReply } from "fastify";

// Rate limit configurations (Production-hardened, GitHub-standard)
export const rateLimitConfig = {
  // Login: 5 per minute per IP (prevents brute-force)
  login: {
    max: 5,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many login attempts. Please wait before trying again.",
      retryAfter: 60,
    }),
  },

  // Registration: 3 per minute per IP (prevents spam accounts)
  register: {
    max: 3,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many registration attempts. Please try again later.",
      retryAfter: 60,
    }),
  },

  // OAuth: 10 per minute per IP
  oauth: {
    max: 10,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many OAuth attempts. Please try again soon.",
      retryAfter: 60,
    }),
  },

  // Password reset: 3 per minute per IP (prevents email spam)
  passwordReset: {
    max: 3,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many password reset requests. Please try again later.",
      retryAfter: 60,
    }),
  },

  // OTP sending: 3 per minute per IP
  otpSend: {
    max: 3,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many OTP requests. Please try again later.",
      retryAfter: 60,
    }),
  },

  // Email verification resend: 3 per minute
  verifyEmail: {
    max: 3,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Too many verification requests. Please try again later.",
      retryAfter: 60,
    }),
  },

  // General API: 300 requests per minute per IP
  general: {
    max: 300,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please slow down.",
      retryAfter: 60,
    }),
  },
};

/**
 * Custom key generator for rate limiting
 * Uses IP address + user ID if authenticated
 */
export function rateLimitKeyGenerator(request: FastifyRequest): string {
  const ip = request.ip;
  const userId = (request as any).user?.userId;

  // Include user ID if authenticated to prevent one user from blocking others
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Per-email key generator for login rate limiting.
 * Prevents botnet attacks that rotate IPs but target the same email.
 * Falls back to IP if no email in request body.
 */
export function loginKeyGenerator(request: FastifyRequest): string {
  const body = request.body as Record<string, unknown> | null;
  const email = body?.email || body?.username;
  if (typeof email === "string" && email.length > 0) {
    return `login:${email.toLowerCase()}`;
  }
  return `login:${request.ip}`;
}

/**
 * Per-email key generator for password reset rate limiting.
 */
export function passwordResetKeyGenerator(request: FastifyRequest): string {
  const body = request.body as Record<string, unknown> | null;
  const email = body?.email;
  if (typeof email === "string" && email.length > 0) {
    return `pwreset:${email.toLowerCase()}`;
  }
  return `pwreset:${request.ip}`;
}

/**
 * Add Retry-After header on rate limit
 */
export function rateLimitErrorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  reply.code(429);
  reply.header("Retry-After", "900"); // 15 minutes in seconds
}



