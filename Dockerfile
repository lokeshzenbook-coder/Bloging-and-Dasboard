# syntax=docker/dockerfile:1.7

# =========================================================
# Stage 1 - Base Dependencies
# =========================================================
FROM node:22-alpine3.22 AS deps

# Install tini for proper signal handling
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy only dependency files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies using clean reproducible install
RUN npm ci --include=dev \
    && npm cache clean --force

# =========================================================
# Stage 2 - Build Application
# =========================================================
FROM node:22-alpine3.22 AS builder

WORKDIR /app

# Reuse dependencies layer
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build TypeScript application
RUN npm run build

# Remove unnecessary files
RUN rm -rf src tests docs .github

# Remove development dependencies
RUN npm prune --omit=dev

# =========================================================
# Stage 3 - Production Runtime
# =========================================================
FROM gcr.io/distroless/nodejs22-debian12:nonroot

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy only required runtime files
COPY --chown=nonroot:nonroot --from=builder /app/dist ./dist
COPY --chown=nonroot:nonroot --from=builder /app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=builder /app/package.json ./package.json

# Application runs as non-root automatically
EXPOSE 3000

# Healthcheck support via Node runtime
CMD ["dist/index.js"]
