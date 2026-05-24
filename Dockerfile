# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript project
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy build files from builder stage
COPY --from=builder /app/dist ./dist

# Expose application port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
