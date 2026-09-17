# =========================================================
# Multi-Stage Dockerfile for Corporate Phonebook Application
# =========================================================

# Stage 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install all dependencies for compiling client and server
RUN npm install

# Copy application source code
COPY . .

# Compile Frontend (Vite) and Backend (esbuild bundle to dist/server.cjs)
RUN npm run build

# =========================================================
# Stage 2: Production Runtime
# =========================================================
FROM node:20-alpine AS runner

# Install wget and ca-certificates for health checks
RUN apk add --no-cache wget ca-certificates

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled production bundle from builder
COPY --from=builder /app/dist ./dist

# Copy default seed storage structure (data, uploads)
COPY --from=builder /app/storage ./storage

# Expose HTTP port
EXPOSE 3000

# Declare persistent volume for all database, uploads, and backups
VOLUME ["/app/storage"]

# Health check to ensure server responds OK
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the bundled Express + Vite static server
CMD ["node", "dist/server.cjs"]
