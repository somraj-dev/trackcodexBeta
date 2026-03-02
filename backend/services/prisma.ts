import { PrismaClient } from "@prisma/client";

// Shared PrismaClient instance to be used across the entire application.
// This prevents connection pool exhaustion in production (Render).
const prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Diagnostic: Log connection target (masked) on first import
const dbUrl = process.env.DATABASE_URL || "";
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.warn(`[PRISMA] Initialized for: ${maskedUrl || "MISSING DATABASE_URL"}`);

// Test connection on startup
prismaInstance.$connect()
    .then(() => console.warn("✅ [PRISMA] Database connection established"))
    .catch((err) => console.error("❌ [PRISMA] Database connection failed:", err.message));

export const prisma = prismaInstance;

// Graceful shutdown
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});
