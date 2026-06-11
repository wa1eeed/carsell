/**
 * POST /api/v1/subscriptions — start trial after registration
 * GET  /api/v1/subscriptions — get current showroom subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { startTrial, initiateCheckout } from '@/services/subscription.service'
import { getSubscriptionByShowroom } from '@/repositories/plan.repository'
import logger from '@/lib/logger'

const startTrialSchema = z.object({
  planId:        z.string().uuid(),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
})

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()

  const body = await req.json() as unknown
  const parsed = startTrialSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  try {
    await startTrial({
      showroomId:    session.showroomId,
      planId:        parsed.data.planId,
      billingPeriod: parsed.data.billingPeriod,
      userName:      session.name ?? 'User',
      userEmail:     session.email ?? undefined,
    })
    return apiResponse.created({ message: 'Trial started' })
  } catch (err) {
    logger.error({ err }, 'POST /subscriptions failed')
    return apiResponse.serverError()
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()

  const sub = await getSubscriptionByShowroom(session.showroomId)
  return NextResponse.json({ subscription: sub })
}
