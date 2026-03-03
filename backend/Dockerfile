# Integravity Production Dockerfile
# Optimized for Node.js, security, and scalability.

FROM node:20.20.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build application
COPY . .
RUN npx prisma generate --schema=backend/schema.prisma
# We might need to adjust the build script if it expects to be in /backend
# If npm run build:backend exists in root package.json:
RUN npm run build:backend

# --- Production Stage ---
FROM node:20.20.0-alpine

WORKDIR /app

# Least privilege security
RUN addgroup -S trackcodex && adduser -S trackcodex -G trackcodex
USER trackcodex

# Copy build artifacts
COPY --from=builder /app/dist-backend ./dist-backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000

ENV NODE_ENV=production

# Health check: ECS / Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist-backend/index.js"]
