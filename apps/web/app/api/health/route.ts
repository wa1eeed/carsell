import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'
import { STORAGE_EXPIRY } from '@/lib/constants'

export const dynamic = 'force-dynamic'

/**
 * Health check — DB + Storage connectivity. Coolify polls this every 30s.
 * Returns 200 when both are reachable, 503 otherwise.
 */
export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    getStorage()
      .createUploadUrl({ key: '_healthcheck/probe', contentType: 'text/plain', expiresIn: STORAGE_EXPIRY.UPLOAD_URL })
      .then(() => true),
  ])

  const db = checks[0].status === 'fulfilled'
  const storage = checks[1].status === 'fulfilled'
  const status = db && storage ? 200 : 503

  return NextResponse.json(
    { ok: db && storage, db, storage, env: process.env.NODE_ENV ?? 'development', time: new Date().toISOString() },
    { status },
  )
}
