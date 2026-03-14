import { PrismaClient } from "@prisma/client";

// Shared PrismaClient instance to be used across the entire application.
// This prevents connection pool exhaustion in production.
const prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Diagnostic: Log connection target (masked) on first import
const dbUrl = process.env.DATABASE_URL || "";
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.warn(`[PRISMA] Initialized for: ${maskedUrl || "MISSING DATABASE_URL"}`);

// NOTE: Do NOT call prismaInstance.$connect() here.
// The connection lifecycle is managed exclusively by server.ts bootstrap().
// Calling $connect() here creates a race condition with the retry logic in server.ts.

export const prisma = prismaInstance;

// Graceful shutdown
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});
