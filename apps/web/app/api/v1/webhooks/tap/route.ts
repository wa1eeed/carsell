/**
 * POST /api/v1/webhooks/tap
 * Receives Tap.company webhook events (charge.captured, charge.failed, etc.)
 * Secured by verifying the request signature or secret key match.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleTapWebhook } from '@/services/subscription.service'
import { getPlatformSetting } from '@/repositories/plan.repository'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Tap sends the secret key in Authorization header for webhook verification
  const authHeader = req.headers.get('authorization') ?? ''
  const incomingKey = authHeader.replace('Bearer ', '').trim()

  try {
    const storedKey = await getPlatformSetting('tap_secret_key')
    const envKey = process.env.TAP_SECRET_KEY ?? ''
    const expectedKey = storedKey ?? envKey

    if (expectedKey && incomingKey !== expectedKey) {
      logger.warn('tap webhook: invalid signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    // Allow if no key configured yet (dev mode)
  }

  const event = await req.json() as {
    type?: string
    data?: { object?: { id?: string; status?: string; card?: { id?: string } } }
  }
  logger.info({ type: event.type }, 'Tap webhook received')

  const chargeId = event.data?.object?.id
  const status   = event.data?.object?.status
  const cardId   = event.data?.object?.card?.id

  if (!chargeId || !status) {
    return NextResponse.json({ ok: true })
  }

  try {
    await handleTapWebhook(chargeId, status, cardId)
  } catch (err) {
    logger.error({ err, chargeId }, 'tap webhook processing failed')
    // Return 200 to prevent Tap from retrying (we log the error)
  }

  return NextResponse.json({ ok: true })
}
