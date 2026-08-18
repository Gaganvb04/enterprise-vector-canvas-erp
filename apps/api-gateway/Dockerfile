# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: install deps & compile TypeScript → JavaScript
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer-cache efficiency
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install ALL deps (including devDeps needed for tsc + prisma generate)
RUN npm install --frozen-lockfile

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript
RUN npx prisma generate && npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runner: lean production image with only compiled output
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install runtime OpenSSL & libc compatibility libraries for Prisma
RUN apk add --no-cache openssl libc6-compat

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files and install PRODUCTION deps only
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm install --frozen-lockfile --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 4000

# Health-check so orchestrators know when the service is ready
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/server.js"]
