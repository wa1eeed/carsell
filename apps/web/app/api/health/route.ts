import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'
import { STORAGE_EXPIRY } from '@/lib/constants'

export const dynamic = 'force-dynamic'

/**
 * Health check — Coolify/load-balancer polls this every 30s.
 *
 * Robustness design (liveness vs degraded):
 *   - DB is CRITICAL: if it's down the app can't function → 503 (restart container)
 *   - Storage (R2) is NON-CRITICAL for liveness: a transient R2 hiccup only breaks
 *     uploads, not page serving. We report it as degraded but stay 200 so a brief
 *     R2 blip does NOT trigger a container restart loop.
 *
 * Response: { ok, db, storage, degraded, env, time }
 *   status 200 → DB up (storage may be degraded)
 *   status 503 → DB down (genuinely unhealthy)
 */
export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    // Wrap in async so a SYNCHRONOUS throw (e.g. missing R2 env) is captured
    // by allSettled instead of crashing the whole handler.
    (async () =>
      getStorage().createUploadUrl({
        key: '_healthcheck/probe',
        contentType: 'text/plain',
        expiresIn: STORAGE_EXPIRY.UPLOAD_URL,
      }))(),
  ])

  const db      = checks[0].status === 'fulfilled'
  const storage = checks[1].status === 'fulfilled'

  // Only the database determines liveness. Storage being down = degraded, not dead.
  const status   = db ? 200 : 503
  const degraded = db && !storage

  return NextResponse.json(
    {
      ok:       db,
      db,
      storage,
      degraded,
      env:      process.env.NODE_ENV ?? 'development',
      time:     new Date().toISOString(),
    },
    { status },
  )
}
