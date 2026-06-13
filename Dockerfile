# ─────────────────────────────────────────────────────────────
# CarSell — Production Dockerfile (REPO ROOT)
# Build context = repo root, so Coolify finds it at the default /Dockerfile.
# All COPY paths are relative to the repo root (apps/web/...).
# Multi-stage, Next.js standalone output.
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
# Force dev dependencies even if Coolify injects NODE_ENV=production at build time.
ENV NODE_ENV=development
COPY apps/web/package.json apps/web/package-lock.json* ./
COPY apps/web/prisma ./prisma
RUN npm ci --include=dev --prefer-offline

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# Limit Node.js memory to avoid OOM on low-RAM VPS (adjust if you have more RAM)
ENV NODE_OPTIONS="--max-old-space-size=2048"
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
RUN npx prisma generate
RUN npm run build
# The seed is plain JS (prisma/seed.mjs) — runs with `node prisma/seed.mjs`,
# no compile/tsx needed. It's already carried by the `COPY prisma` below.

# ── Runtime ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output + static assets + prisma (for migrations)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma  ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# bcryptjs is used by the seed (super admin password) but isn't traced into
# the standalone output — copy it explicitly (pure JS, no native deps).
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Entrypoint runs migrations then starts the server
COPY --chown=nextjs:nodejs apps/web/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Use 127.0.0.1 (IPv4) — the server binds to 0.0.0.0 (IPv4); 'localhost' would
# resolve to ::1 (IPv6) and be refused. Generous start-period covers first-deploy
# migrations (applying all migrations to a fresh DB takes time).
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD wget -q --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
