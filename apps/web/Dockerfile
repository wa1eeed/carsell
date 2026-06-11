# ─────────────────────────────────────────────────────────────
# CarSell — Production Dockerfile (multi-stage, Next.js standalone)
# For VPS deployment via Coolify
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
# Force dev dependencies even if Coolify injects NODE_ENV=production at build time.
# devDependencies (typescript, next build tooling) are REQUIRED to build.
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --include=dev

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
# Keep build-time NODE_ENV unset/development so all tooling is available.
# (next build internally sets production mode for the output regardless.)
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client must be generated before build
RUN npx prisma generate
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output + static assets + prisma (for migrations)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Prisma CLI + migration engine (needed by entrypoint for `migrate deploy`)
COPY --from=builder /app/node_modules/prisma  ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint runs migrations then starts the server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check hits the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
