# --- Builder Stage ---
FROM node:20.20.0-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root package files for complete environment
COPY package.json ./
# Copy lockfile if it exists (using wildcard to prevent crash if missing)
COPY package-lock.json* ./

# Install dependencies (development needed for prisma generate)
# Use legacy-peer-deps for compatibility
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy backend schema and pre-built bundle
COPY backend/schema.prisma ./backend/
COPY dist-backend ./dist-backend

# Generate Prisma Client
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=backend/schema.prisma

# Prune to production only
RUN npm prune --production --legacy-peer-deps


# --- Production Stage ---
FROM node:20.20.0-slim

WORKDIR /app

# Install runtime dependencies required by Prisma + curl for health checks
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r trackcodex && useradd -r -g trackcodex trackcodex

# Copy artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist-backend ./dist-backend
COPY --from=builder /app/backend/schema.prisma ./backend/schema.prisma

# Create data directory and set ownership
RUN mkdir -p /app/data/repos && \
  chown -R trackcodex:trackcodex /app && \
  chmod -R 755 /app/data

# Security: Switch to non-root user
USER trackcodex

EXPOSE 4000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -sf http://localhost:4000/api/health || exit 1

CMD ["node", "dist-backend/index.js"]
