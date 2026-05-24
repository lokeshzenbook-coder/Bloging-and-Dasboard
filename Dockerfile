# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build TypeScript application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

# ---------- Stage 3: Production ----------
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Use non-root user for security
USER nonroot

# Expose application port
EXPOSE 3000

# Start application
CMD ["dist/index.js"]
