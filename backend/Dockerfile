# Integravity Production Dockerfile
# Optimized for Node.js (Debian-slim), security, and stability.

# --- Builder Stage ---
FROM node:20.20.0-slim AS builder

WORKDIR /app

# Install build dependencies for native modules and Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install all dependencies (including devDeps like Esbuild, Prisma CLI, etc.)
COPY package*.json ./
RUN npm config set fetch-retries 5 && \
  npm config set fetch-retry-mintimeout 20000 && \
  npm config set fetch-retry-maxtimeout 120000 && \
  npm config set strict-ssl false && \
  npm install --legacy-peer-deps

# Copy source and config
COPY . .

# 1. Generate Prisma Client (Needs the schema file)
# Use placeholder URL to satisfy validation during generation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=backend/schema.prisma

# 2. Build backend bundle
RUN npm run build:backend

# 3. PRUNE development dependencies to shrink the image
RUN npm prune --production --legacy-peer-deps


# --- Production Stage ---
FROM node:20.20.0-slim

WORKDIR /app

# Install runtime dependencies required by Prisma + curl for health checks
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security (Debian style)
RUN groupadd -r trackcodex && useradd -r -g trackcodex trackcodex

# Copy ONLY the essential artifacts from builder
COPY --from=builder /app/dist-backend ./dist-backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/schema.prisma ./backend/schema.prisma

# Create data directory and set ownership
RUN mkdir -p /app/data/repos && \
  chown -R trackcodex:trackcodex /app && \
  chmod -R 755 /app/data

# Security: Switch to non-root user for runtime
USER trackcodex

EXPOSE 4000

ENV NODE_ENV=production

# Health check: use curl for reliability, generous start-period for cold starts + DB retry
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -sf http://localhost:4000/api/health || exit 1

CMD ["node", "dist-backend/index.js"]
