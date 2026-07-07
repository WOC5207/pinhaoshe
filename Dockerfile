# ---- Stage 1: install dependencies -----------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Stage 2: build ---------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_STANDALONE=1 makes next.config.ts emit the standalone server bundle
# that the runtime stage below copies from .next/standalone.
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE=1
# Dummy values so the build never needs the real .env; all real config is
# injected at runtime by docker-compose.
ENV DATABASE_URL="file:/tmp/build.db" \
    PHOTOS_DIR="/tmp/photos" \
    SESSION_SECRET="build-time-placeholder-secret-not-used" \
    APP_BASE_URL="http://localhost:3000"
RUN npx prisma generate && npm run build

# ---- Stage 3: runtime -------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Standalone server + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema/migrations + CLI (for `migrate deploy` on startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
