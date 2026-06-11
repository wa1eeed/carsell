/**
 * POST /api/v1/admin/cleanup/media
 *
 * Triggered by Coolify / external cron — runs the media cleanup job.
 * Secured by CRON_SECRET env variable (bearer token).
 *
 * Schedule: daily at 03:00 KSA (00:00 UTC)
 * Example cron command:
 *   curl -X POST https://app.carsell.one/api/v1/admin/cleanup/media \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import { runMediaCleanup } from '@/services/media-cleanup.service'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth   = req.headers.get('authorization') ?? ''
  const token  = auth.replace('Bearer ', '').trim()
  const secret = process.env.CRON_SECRET

  if (!secret || token !== secret) {
    logger.warn({ ip: req.headers.get('x-forwarded-for') }, 'media-cleanup: unauthorized attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runMediaCleanup()
    logger.info(result, 'media-cleanup: job complete')
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    logger.error({ err }, 'media-cleanup: job failed')
    return NextResponse.json({ ok: false, error: 'Cleanup failed' }, { status: 500 })
  }
}
