# Integravity Production Dockerfile
# Optimized for Node.js, security, and scalability.

# --- Builder Stage ---
FROM node:20.20.0-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDeps like Esbuild, Prisma CLI, etc.)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and config
COPY . .

# 1. Generate Prisma Client (Needs the schema file)
# Use placeholder URL to satisfy validation during generation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate --schema=backend/schema.prisma

# 2. Build backend bundle
RUN npm run build:backend

# 3. PRUNE development dependencies to shrink the image
# This removes Electron, Vite, etc., saving 300MB+
RUN npm prune --production --legacy-peer-deps


# --- Production Stage ---
FROM node:20.20.0-alpine

WORKDIR /app

# Install native dependencies required by Prisma
RUN apk add --no-cache openssl libc6-compat

# Create non-root user for security
RUN addgroup -S trackcodex && adduser -S trackcodex -G trackcodex

# Copy ONLY the essential artifacts from builder
COPY --from=builder /app/dist-backend ./dist-backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/schema.prisma ./backend/schema.prisma
# Restore placeholder for any runtime generation needs (though primarily using copied nodules)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Create data directory and set ownership
RUN mkdir -p /app/data/repos && \
    chown -R trackcodex:trackcodex /app && \
    chmod -R 755 /app/data

# Security: Switch to non-root user for runtime
USER trackcodex

EXPOSE 4000

ENV NODE_ENV=production

# Health check: ECS / Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist-backend/index.js"]
