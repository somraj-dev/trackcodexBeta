import { env } from "./config/env";

async function main() {
  console.log("--- BACKEND ENV CHECK (NO PRISMA) ---");
  console.log("DATABASE_URL:", env.DATABASE_URL ? env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@") : "MISSING");
  console.log("NODE_ENV:", env.NODE_ENV);
  console.log("BACKEND_URL:", env.BACKEND_URL);
}

main();
