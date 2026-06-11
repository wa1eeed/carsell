/**
 * PATCH /api/v1/admin/showrooms/[id]/subscription
 * Admin override — change subscription status or plan
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { updateSubscription } from '@/repositories/plan.repository'

const schema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED']).optional(),
  planId: z.string().uuid().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const updated = await updateSubscription(params.id, parsed.data)
  return apiResponse.ok({ subscription: updated })
}
