/**
 * POST  /api/v1/subscriptions — start trial after registration
 * GET   /api/v1/subscriptions — get current showroom subscription
 * PATCH /api/v1/subscriptions — change plan (logged-in showroom owner)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { startTrial, initiateCheckout } from '@/services/subscription.service'
import { getSubscriptionByShowroom, updateSubscription, createSubscription } from '@/repositories/plan.repository'
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

const changePlanSchema = z.object({
  planId:        z.string().uuid(),
  billingPeriod: z.enum(['MONTHLY', 'YEARLY']).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()

  const body = await req.json() as unknown
  const parsed = changePlanSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  try {
    const existing = await getSubscriptionByShowroom(session.showroomId)
    if (existing) {
      // Update existing subscription plan
      const updated = await updateSubscription(session.showroomId, {
        planId:        parsed.data.planId,
        ...(parsed.data.billingPeriod ? { billingPeriod: parsed.data.billingPeriod } : {}),
      })
      return apiResponse.ok({ subscription: updated })
    } else {
      // No subscription yet — start a trial on the selected plan
      await startTrial({
        showroomId:    session.showroomId,
        planId:        parsed.data.planId,
        billingPeriod: parsed.data.billingPeriod ?? 'MONTHLY',
        userName:      session.name ?? 'User',
        userEmail:     session.email ?? undefined,
      })
      return apiResponse.created({ message: 'Trial started' })
    }
  } catch (err) {
    logger.error({ err }, 'PATCH /subscriptions failed')
    return apiResponse.serverError()
  }
}
