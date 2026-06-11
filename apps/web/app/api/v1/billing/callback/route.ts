/**
 * GET /api/v1/billing/callback?tap_id=xxx&subscriptionId=xxx
 * Tap redirects here after payment. We verify then redirect to dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { retrieveCharge } from '@/lib/tap/tap.service'
import { handleTapWebhook } from '@/services/subscription.service'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tapId = searchParams.get('tap_id')
  const locale = searchParams.get('locale') ?? 'ar'

  if (!tapId) {
    return NextResponse.redirect(new URL(`/${locale}/billing?status=error`, req.url))
  }

  try {
    const charge = await retrieveCharge(tapId)
    await handleTapWebhook(charge.id, charge.status, charge.card?.id)

    if (charge.status === 'CAPTURED') {
      return NextResponse.redirect(new URL(`/${locale}/billing?status=success`, req.url))
    } else {
      return NextResponse.redirect(new URL(`/${locale}/billing?status=failed`, req.url))
    }
  } catch (err) {
    logger.error({ err, tapId }, 'billing callback error')
    return NextResponse.redirect(new URL(`/${locale}/billing?status=error`, req.url))
  }
}
