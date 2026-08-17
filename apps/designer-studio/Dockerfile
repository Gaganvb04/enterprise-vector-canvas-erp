# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: install deps & build Vite production bundle
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for layer cache
COPY package.json package-lock.json ./

# Install ALL deps (devDeps needed for Vite build + tsc)
RUN npm install --frozen-lockfile

# Copy full source (including tsconfig, vite.config, public, src)
COPY . .

# Build the production bundle → /app/dist
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runner: Nginx serves the static Vite build output
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config (SPA routing + gzip + caching headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
