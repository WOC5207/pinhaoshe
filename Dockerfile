# ---- Stage 1: install dependencies -----------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
# node:22-alpine ships an npm whose `ci` is overly strict about unsatisfied
# *optional* peer dependencies (e.g. @swc/core's optional peer on
# @swc/helpers, which next-intl pulls in but next itself pins to a version
# that doesn't satisfy it) and fails the install over something npm's own
# resolver considers fine. Newer npm handles this correctly.
RUN npm install -g npm@11
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
    APP_BASE_URL="http://localhost:3312"
RUN npx prisma generate && npm run build

# ---- Stage 3: runtime -------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3312

# Standalone server + static assets
# (no COPY for /app/public — this project has no Next.js public/ folder;
# all photos/logo are served at runtime from the PHOTOS_DIR volume via
# custom API routes instead)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema/migrations + CLI (for `migrate deploy` on startup). The full
# node_modules (not just prisma/@prisma/.prisma) is needed because the
# Prisma CLI's own transitive dependencies shift between versions (e.g.
# 6.16+ added @prisma/config, which pulls in "effect") — hand-picking
# folders here breaks again every time Prisma adds one. The Next.js server
# itself doesn't need this (its trimmed deps already came in via
# .next/standalone above); this only exists for the CLI the entrypoint
# script runs at container start.
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules

COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Strip any stray \r (e.g. from a Windows-side edit) so the shebang always
# resolves to /bin/sh — a CRLF-corrupted shebang fails at exec time with a
# confusing "no such file or directory" instead of a syntax error.
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3312
ENTRYPOINT ["./docker-entrypoint.sh"]
