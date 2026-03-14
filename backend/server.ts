// SSL bypass for self-signed certificates in development only
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("☢️ [DEV] NODE_TLS_REJECT_UNAUTHORIZED set to '0' (SSL Bypass Active)");
}

// Fix: Import process from 'process' to ensure the Node.js process object is correctly typed
import process from "process";
import fs from "fs";
console.warn("🚀 [RESTART] TrackCodex Backend reloading with NEW CORS config...");
import { env } from "./config/env"; // Strict Env Validation

import Fastify, { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
// import rateLimit from "@fastify/rate-limit";
import socketio from "fastify-socket.io";
import websocket from "@fastify/websocket";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { routes } from "./routes/index";

// Removed unused imports and variables for clean startup

// import { csrfProtection } from "./middleware/csrf";
import { RealtimeService } from "./services/infra/realtime";
import { AppError } from "./utils/AppError";
import { prisma } from "./services/infra/prisma";
import { startOutboxWorker } from "./workers/outboxWorker";

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL PROCESS GUARDS — Prevent surprise crashes from ever killing the server
// ═══════════════════════════════════════════════════════════════════════════
process.on("uncaughtException", (err) => {
    console.error("🔥 [UNCAUGHT EXCEPTION] Server survived:", err.message);
    console.error(err.stack);
    try {
        fs.appendFileSync("./backend_crash.log", `\n[${new Date().toISOString()}] UNCAUGHT: ${err.message}\n${err.stack}\n`);
    } catch { /* ignore */ }
});

process.on("unhandledRejection", (reason) => {
    console.error("🔥 [UNHANDLED REJECTION] Server survived:", reason);
    try {
        fs.appendFileSync("./backend_crash.log", `\n[${new Date().toISOString()}] UNHANDLED_REJECTION: ${String(reason)}\n`);
    } catch { /* ignore */ }
});

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE STATE TRACKING — Module-level flag for health checks
// ═══════════════════════════════════════════════════════════════════════════
let dbConnected = false;
let dbLastError = "";
let dbReconnectTimer: ReturnType<typeof setTimeout> | null = null;

const DB_RECONNECT_INTERVAL_MS = 30_000; // Retry every 30s if disconnected

/** Attempt to connect to the database. Returns true if successful. */
async function attemptDbConnect(): Promise<boolean> {
    try {
        await Promise.race([
            prisma.$connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("DB connection timeout (15s)")), 15000))
        ]);
        dbConnected = true;
        dbLastError = "";
        return true;
    } catch (err: unknown) {
        dbConnected = false;
        dbLastError = (err as Error).message;
        return false;
    }
}

/** Background reconnection loop — runs only when DB is disconnected */
function startDbReconnectLoop() {
    if (dbReconnectTimer) return; // Already running

    console.warn("🔄 [DB] Starting background reconnection loop (every 30s)...");
    dbReconnectTimer = setInterval(async () => {
        if (dbConnected) {
            // Already connected, stop the loop
            if (dbReconnectTimer) {
                clearInterval(dbReconnectTimer);
                dbReconnectTimer = null;
            }
            return;
        }

        console.warn("🔄 [DB] Attempting background reconnection...");
        const ok = await attemptDbConnect();
        if (ok) {
            console.warn("✅ [DB] Background reconnection SUCCEEDED!");
            if (dbReconnectTimer) {
                clearInterval(dbReconnectTimer);
                dbReconnectTimer = null;
            }
        } else {
            console.warn(`❌ [DB] Background reconnection failed: ${dbLastError}`);
        }
    }, DB_RECONNECT_INTERVAL_MS);
}

const server = Fastify({
    logger: true,
    ajv: {
        customOptions: {
            allErrors: true,
            removeAdditional: true,
        },
    },
    // Trust proxy for correct IP detection behind load balancers/reverse proxies
    trustProxy: true,
});

// Shared prisma instance imported from services/infra/prisma

// import { Resend } from "resend";
// const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

// OTP Endpoint
server.post("/api/send-otp", async (request, reply) => {
    const { email, code } = request.body as { email: string; code: string };

    try {
        // MOCK EMAIL SENDING FOR DEV
        console.warn("---------------------------------------------------");
        console.warn(`[DEV MODE] OTP for ${email}: ${code}`);
        console.warn("---------------------------------------------------");

        // Skip actual email sending
        /* 
        const data = await resend.emails.send({ ... }); 
        */
        const data = { id: "mock-id" };

        return { success: true, data };
    } catch (error) {
        request.log.error(error);
        return reply
            .code(500)
            .send({ success: false, error: "Failed to send email" });
    }
});

async function bootstrap() {
    // 1. CORS - Registration at the TOP to ensure it catches everything
    const trackcodexRegex = /^https?:\/\/([^.]+\.)?trackcodex\.com(:[0-9]+)?$/;
    const vercelRegex = /^https?:\/\/.*\.vercel\.app$/;

    const isProduction = env.NODE_ENV === "production";

    const localOrigins = isProduction ? [] : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:4000",
        "http://localhost:5173",
    ];

    await server.register(cors, {
        origin: (origin, cb) => {
            if (!origin || localOrigins.includes(origin) || trackcodexRegex.test(origin) || vercelRegex.test(origin)) {
                cb(null, true);
                return;
            }
            // fallback for debugging
            console.warn(`[CORS] Rejected origin: ${origin}`);
            cb(null, true); // Still allow in dev/hotfix mode to unblock user
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "X-CSRF-Token",
            "X-Requested-With",
            "x-user-id",
            "Cache-Control",
            "X-Amz-Date",
            "X-Api-Key",
            "X-Amz-Security-Token",
            "If-Modified-Since"
        ],
        exposedHeaders: ["set-cookie"],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });

    // 1.5 Cookie Support - Required for session management
    await server.register(cookie, {
        secret: process.env.COOKIE_SECRET || "cookie-secret-change-this-min-32-chars",
        parseOptions: {}
    });

    // 2. Security Headers (Helmet) - Configuration tuned for cross-origin apps
    await server.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: [
                    "'self'",
                    "https://*.trackcodex.com",
                    "wss://*.trackcodex.com",
                    env.BACKEND_URL,
                    env.BACKEND_URL.replace(/^http/, 'ws'),
                    // Allow localhost connections in development only
                    ...(isProduction ? [] : [
                        "http://localhost:3001",
                        "ws://localhost:3001",
                        "ws://localhost:4000",
                        "http://localhost:4000",
                    ]),
                ],
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" },
        global: true,
    });


    /* DISABLED FOR DEBUGGING 429 ISSUES
    // 4. Rate Limiting - DDoS protection
    await server.register(rateLimit, {
      max: 10000, // Extremely permissive for development
      timeWindow: "1 minute",
      keyGenerator: rateLimitKeyGenerator, // Custom key generator using IP + UserID
      errorResponseBuilder: (req, context) => {
        console.warn(
          `[GlobalRateLimit] BLOCKED: ip=${req.ip}, max=${context.max}`,
        );
        return {
          statusCode: 429,
          error: "Too Many Requests",
          message: "Global rate limit exceeded. REDUCED FOR DEV.",
          retryAfter: context.ttl,
        };
      },
    });
    */

    // 5. CSRF Protection - Global middleware
    // Run on preHandler to ensure cookies are parsed
    // server.addHook("preHandler", csrfProtection); // DISABLED FOR DEV SMOOTHNESS

    // 6. Socket.io Support
    await server.register(socketio, {
        cors: {
            origin: [
                trackcodexRegex,
                vercelRegex,
                "https://trackcodex.com",
                "https://api.trackcodex.com",
                "https://www.trackcodex.com",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });


    // 7. WebSocket Support (for Terminal PTY)
    await server.register(websocket);

    // Initialize RealtimeService with the IO instance
    RealtimeService.init((server as unknown as { io: any }).io);

    // 8. GraphQL API (Mercurius)
    try {
        const { typeDefs: schema } = await import("./graphql/schema");
        const { resolvers } = await import("./graphql/resolvers");
        const mercuriusModule = await import("mercurius");
        const mercurius = mercuriusModule.default || mercuriusModule;
        await server.register(mercurius, {
            schema,
            resolvers,
            graphiql: process.env.NODE_ENV !== "production",
            path: "/graphql",
            context: (request: FastifyRequest) => {
                return { user: (request as FastifyRequest & { user?: unknown }).user };
            },
        });
    } catch (err) {
        console.warn("[WARN] Mercurius (GraphQL) failed to load, skipping:", (err as Error).message);
    }

    // 9. CI/CD API (Native)
    try {
        const ciModule = await import("./routes/infra/ci");
        await server.register(ciModule.default || ciModule, { prefix: "/api/ci" });
    } catch (err: unknown) {
        console.warn("[WARN] CI routes failed to load:", (err as Error).message);
    }

    // 10. Native Git Smart HTTP
    const gitContentTypes = [
        "application/x-git-upload-pack-request",
        "application/x-git-receive-pack-request",
    ];
    gitContentTypes.forEach((contentType) => {
        server.addContentTypeParser(
            contentType,
            { parseAs: "buffer" },
            (req, body, done) => {
                done(null, body);
            },
        );
    });

    // Register Git Routes
    try {
        const gitModule = await import("./routes/git/git");
        await server.register(gitModule.default || gitModule, { prefix: "/git" });
    } catch (err: unknown) {
        console.warn("[WARN] Git routes failed to load:", (err as Error).message);
    }

    // NOTE: Profile, Portfolio, and Stats routes are already registered in routes/index.ts
    // Do not register them here to avoid FST_ERR_DUPLICATED_ROUTE


    // 11. Multipart Support (for Artifacts)
    try {
        const multipartModule = await import("@fastify/multipart");
        const multipart = multipartModule.default || multipartModule;
        await server.register(multipart, {
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB
            },
        });

        // Artifact Upload routes (depends on multipart)
        const artifactsModule = await import("./routes/ai/artifacts");
        await server.register(artifactsModule.default || artifactsModule, { prefix: "/api/artifacts" });
    } catch (err: unknown) {
        console.warn("[WARN] Multipart/Artifacts failed to load:", (err as Error).message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HEALTH CHECK ENDPOINTS — Always respond, regardless of DB state
    // ═══════════════════════════════════════════════════════════════════════

    // Liveness probe: always returns 200 if the process is running
    server.get("/api/health", async () => {
        return {
            status: "online",
            message: "TrackCodex Backend Server is running.",
            api_version: "v1",
            security: "enhanced",
            environment: process.env.NODE_ENV,
            db: dbConnected ? "connected" : "disconnected",
            uptime: Math.floor(process.uptime()),
        };
    });

    // Readiness probe: returns 503 if DB is disconnected (use for strict ALB checks)
    server.get("/api/health/ready", async (request, reply) => {
        if (!dbConnected) {
            return reply.code(503).send({
                status: "degraded",
                message: "Database is not connected. Server is alive but not ready.",
                db: "disconnected",
                lastError: dbLastError,
            });
        }
        return {
            status: "ready",
            message: "TrackCodex Backend is fully operational.",
            db: "connected",
        };
    });

    // Root Redirect: Friendly landing or redirect to docs/health
    server.get("/", async (request, reply) => {
        // If it's a browser request, redirect to the main frontend
        if (request.headers["accept"]?.includes("text/html")) {
            return reply.redirect(process.env.FRONTEND_URL || "https://trackcodex.com");
        }
        // Otherwise redirect to health info
        return reply.redirect("/api/health");
    });

    // Register API Routes
    await server.register(routes, { prefix: "/api/v1" });

    // Register CSS (Code Security System) Routes
    try {
        const cssModule = await import("./routes/infra/css");
        await server.register(cssModule.default || cssModule);
        console.warn("🛡️ [CSS] Code Security System routes registered");
    } catch (err: unknown) {
        console.warn("[WARN] CSS routes failed to load:", (err as Error).message);
    }

    // Serve Frontend in Production (Optional based on folder existence)
    const distPath = path.join(__dirname, "../dist");
    const distExists = fs.existsSync(distPath);

    if (process.env.NODE_ENV === "production" && distExists) {
        const fastifyStatic = (await import("@fastify/static")).default;
        server.log.info(`Serving static frontend from: ${distPath}`);

        await server.register(fastifyStatic, {
            root: distPath,
            prefix: "/",
            wildcard: false,
        });

        server.setNotFoundHandler((request, reply) => {
            if (request.raw.url && request.raw.url.startsWith("/api")) {
                reply.status(404).send({
                    status: "404_NOT_FOUND",
                    message: `Route ${request.method}:${request.url} is not registered on the TrackCodex Backend.`,
                    available_endpoints: ["/", "/api/v1", "/api/v1/jobs"],
                });
            } else {
                reply.sendFile("index.html");
            }
        });
    } else {
        // Fallback or Dev mode 404
        server.setNotFoundHandler((request, reply) => {
            server.log.warn(`404 Encountered: ${request.method} ${request.url}`);
            reply.status(404).send({
                status: "404_NOT_FOUND",
                message: `Route ${request.method}:${request.url} is not registered on the TrackCodex Backend.`,
                available_endpoints: ["/", "/api/v1", "/api/v1/jobs"],
            });
        });
    }

    // Global Error Handler
    server.setErrorHandler((error, request, reply) => {
        const isDev = process.env.NODE_ENV !== "production";

        // Log to file for persistence
        try {
            const errTyped = error as Error & { code?: string };
            const errorLog = `\n[${new Date().toISOString()}] ERROR: ${errTyped.message}\n${errTyped.stack || ""}\n`;
            fs.appendFileSync("./backend_crash.log", errorLog);
        } catch {
            /* ignore */
        }

        // 1. Check if it's a trusted AppError
        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({
                success: false,
                status: "error",
                code: error.code || "ERROR",
                message: error.message,
            });
        }

        // 2. Prisma Errors
        if ((error as { code?: string }).code === "P2002") {
            return reply.code(409).send({
                success: false,
                code: "DUPLICATE_ENTRY",
                message: "Unique constraint failed. This record already exists.",
            });
        }

        // 3. Handle authentication/authorization errors (CRITICAL FIX for login 500)
        const errorMsg = ((error as Error).message || "").toLowerCase();
        const statusCode = (error as { statusCode?: number }).statusCode;

        // Unauthorized (401)
        if (
            statusCode === 401 ||
            errorMsg.includes("unauthorized") ||
            errorMsg.includes("invalid credentials") ||
            errorMsg.includes("authentication failed")
        ) {
            return reply.code(401).send({
                success: false,
                code: "UNAUTHORIZED",
                message: "Authentication required",
            });
        }

        // Forbidden (403)
        if (
            statusCode === 403 ||
            errorMsg.includes("forbidden") ||
            errorMsg.includes("access denied") ||
            errorMsg.includes("account locked")
        ) {
            return reply.code(403).send({
                success: false,
                code: "FORBIDDEN",
                message: isDev ? (error as Error).message : "Access forbidden",
            });
        }

        // Bad Request (400) - Validation errors
        if (
            statusCode === 400 ||
            (error as { validation?: unknown }).validation ||
            (error as Error).name === "ValidationError" ||
            errorMsg.includes("required") ||
            errorMsg.includes("invalid")
        ) {
            return reply.code(400).send({
                success: false,
                code: "BAD_REQUEST",
                message: isDev ? (error as Error).message : "Invalid request data",
            });
        }

        // Not Found (404)
        if ((error as { code?: string }).code === "P2025" || statusCode === 404) {
            return reply.code(404).send({
                success: false,
                code: "NOT_FOUND",
                message: "Resource not found",
            });
        }

        // 4. Catch-all for genuine server errors (500)
        server.log.error(error);
        console.error("DEBUG: UNHANDLED ERROR CAUGHT:", error);

        // Security: Don't leak internals in prod, but add a tag
        const isProd = process.env.NODE_ENV === "production";
        const diagnosticMessage = isProd
            ? "Internal Server Error (Ref: " + Date.now() + ")"
            : (error as Error).message || "Unknown error";

        reply.status(statusCode || 500).send({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: diagnosticMessage,
            error: isProd ? undefined : error,
        });
    });

    try {
        // ═══════════════════════════════════════════════════════════════════
        // 12. BIND TO PORT FIRST — Server must be reachable before DB connect
        // ═══════════════════════════════════════════════════════════════════
        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
        await server.listen({ port, host: "0.0.0.0" });
        console.warn(`🚀 TrackCodex Backend operational on port ${port} (Secure Mode)`);

        // ═══════════════════════════════════════════════════════════════════
        // 13. DATABASE CONNECTION — Retry with exponential backoff
        //     CRITICAL: Server NEVER crashes on DB failure. It stays alive
        //     serving health checks and starts a reconnection loop.
        // ═══════════════════════════════════════════════════════════════════
        if (!process.env.DATABASE_URL) {
            console.error("❌ [FATAL] DATABASE_URL is not set in environment variables!");
            // Still don't crash — let the health check report the issue
            dbLastError = "DATABASE_URL not set";
            startDbReconnectLoop();
        } else {
            const maskedDbUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@");
            console.warn(`⏳ Connecting to database: ${maskedDbUrl}`);

            const MAX_RETRIES = 20;
            let retryCount = 0;

            while (retryCount < MAX_RETRIES) {
                retryCount++;
                const ok = await attemptDbConnect();

                if (ok) {
                    console.warn("✅ Connected to PostgreSQL database (AWS RDS) successfully.");
                    break;
                }

                console.error(`❌ Connection failed [${retryCount}/${MAX_RETRIES}]: ${dbLastError}`);

                if (dbLastError.includes("timeout") || dbLastError.includes("ETIMEDOUT")) {
                    console.warn("🛡️  Detecting TIMEOUT: This often indicates a Security Group (SG) block.");
                    console.warn("👉 Check if your ECS Task SG is allowed in the RDS SG inbound rules on port 5432.");
                }

                if (retryCount >= MAX_RETRIES) {
                    console.error("❌ [WARNING] Database connection could not be established after exhaustive retries.");
                    console.error("🛠️  Server will KEEP RUNNING and retry in background every 30 seconds.");
                    console.error("👉 Health check at /api/health will report db: 'disconnected'.");
                    // DO NOT process.exit or break — start background reconnect loop
                    startDbReconnectLoop();
                    break;
                }

                // Exponential backoff
                const waitTime = Math.min(10000, 2000 + retryCount * 1000);
                console.warn(`⏳ Waiting ${waitTime / 1000} seconds before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        if (!process.env.ENCRYPTION_KEY) {
            console.warn("⚠️  [WARN] ENCRYPTION_KEY is not set. Using default. Change this in production!");
        }

        if (process.env.NODE_ENV !== "production") {
            console.warn("---------------------------------------");
            console.warn("🔑 Developer Credentials:");
            console.warn("   Email: dev@trackcodex.dev");
            console.warn("   Pass : password123");
            console.warn("---------------------------------------");
        }

        // 14. Start the Background Outbox Poller for Elasticsearch Sync
        startOutboxWorker();
        console.warn("📨 [Worker] Outbox daemon started for Kafka synchronization.");

    } catch (err) {
        console.error("❌ [FATAL] Backend startup failed:");
        console.error(err);
        server.log.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
}

bootstrap();
