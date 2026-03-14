import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env explicitly if needed, though running via 'npm run dev' usually handles it
dotenv.config({ path: path.join(process.cwd(), ".env") });

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  BACKEND_URL: z.string().url().default("https://api.trackcodex.com"),

  // Security — defaults prevent crash when secrets are missing from ECS
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters")
    .default("default-encryption-key-CHANGE-IN-PROD!!"),
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters")
    .default("default-cookie-secret-CHANGE-IN-PROD!!"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .optional(),

  // Database
  DATABASE_URL: z.string().url(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Redis (Optional for dev, recommended for prod)
  REDIS_URL: z.string().url().optional(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  FIREBASE_DATABASE_SECRET: z.string().optional(),

  // Frontend
  FRONTEND_URL: z.string().url().default("https://trackcodex.com"),

  // OpenSearch (Elasticsearch)
  ELASTICSEARCH_URL: z.string().url().optional(),
  OPENSEARCH_USERNAME: z.string().optional(),
  OPENSEARCH_PASSWORD: z.string().optional(),
});

// Parse and validate
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const fs = await import("fs");
  const errorMsg = `❌ Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`;
  console.error(errorMsg);
  try {
    fs.appendFileSync(
      "env_error.log",
      `\n[${new Date().toISOString()}]\n${errorMsg}\n`,
    );
  } catch {
    // ignore
  }

  // CRITICAL: Only exit if DATABASE_URL is missing — everything else has defaults
  const issues = _env.error.issues;
  const hasDatabaseUrlError = issues.some((i) => i.path.includes("DATABASE_URL"));
  if (hasDatabaseUrlError) {
    console.error("❌ [FATAL] DATABASE_URL is missing or invalid. Cannot start without a database.");
    process.exit(1);
  }

  // For other issues, log warnings but don't crash
  console.warn("⚠️  [WARN] Some environment variables are invalid. Using defaults where possible.");
}

export const env = _env.success ? _env.data : envSchema.parse({
  ...process.env,
  // Force defaults for critical fields so the server can start
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "default-encryption-key-CHANGE-IN-PROD!!",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "default-cookie-secret-CHANGE-IN-PROD!!",
  FRONTEND_URL: process.env.FRONTEND_URL || "https://trackcodex.com",
});
