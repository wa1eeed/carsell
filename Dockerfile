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
RUN npm ci --include=dev

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
RUN npx prisma generate
RUN npm run build

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

# Entrypoint runs migrations then starts the server
COPY --chown=nextjs:nodejs apps/web/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
