# =========================================================
# Multi-Stage Dockerfile for Corporate Phonebook Application
# =========================================================

# Stage 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

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

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4400
ENV DATA_DIR=/app/data
ENV TZ=Asia/Tehran
ENV RESET_ADMIN_PASSWORD=false
ENV JWT_SECRET=fallback-production-jwt-secret-replace-me
ENV INITIAL_ADMIN_USERNAME=admin
ENV INITIAL_ADMIN_PASSWORD=123

# Copy package manifests and install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled production bundle from builder
COPY --from=builder /app/dist ./dist

# Copy default seed storage structure (data, uploads)
COPY --from=builder /app/storage ./storage

# Expose HTTP port
EXPOSE 4400

# Declare persistent volume for standardized container data root
VOLUME ["/app/data"]

# Lightweight, self-contained, offline-resilient health check using native Node.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 4400) + '/healthz', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the bundled Express + Vite static server
CMD ["node", "dist/server.cjs"]
