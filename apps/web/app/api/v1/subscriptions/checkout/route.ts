/**
 * POST /api/v1/subscriptions/checkout
 * Initiates Tap payment → returns redirect URL
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { initiateCheckout } from '@/services/subscription.service'
import logger from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()

  try {
    const result = await initiateCheckout({
      showroomId: session.showroomId,
      userName:   session.name ?? 'User',
      userEmail:  session.email ?? undefined,
    })
    return apiResponse.ok(result)
  } catch (err) {
    logger.error({ err }, 'POST /subscriptions/checkout failed')
    return apiResponse.serverError()
  }
}
