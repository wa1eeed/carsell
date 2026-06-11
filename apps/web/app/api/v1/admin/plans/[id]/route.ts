/**
 * PATCH  /api/v1/admin/plans/[id]
 * DELETE /api/v1/admin/plans/[id]
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { updatePlan, deletePlan } from '@/repositories/plan.repository'

const updateSchema = z.object({
  name:          z.string().min(1).optional(),
  nameAr:        z.string().min(1).optional(),
  description:   z.string().optional(),
  descriptionAr: z.string().optional(),
  priceMonthly:  z.number().min(0).optional(),
  priceYearly:   z.number().min(0).optional(),
  maxCars:       z.number().int().positive().nullable().optional(),
  features: z.object({
    market:        z.boolean(),
    auctions:      z.boolean(),
    api:           z.boolean(),
    reports:       z.enum(['basic', 'advanced', 'full']),
    support:       z.enum(['email', 'chat', 'priority', 'dedicated']),
    customShowroom: z.boolean(),
    teamMembers:   z.number().nullable(),
  }).optional(),
  isActive:   z.boolean().optional(),
  isPublic:   z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder:  z.number().int().optional(),
  trialDays:  z.number().int().min(0).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const plan = await updatePlan(params.id, parsed.data)
  return apiResponse.ok({ plan })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  await deletePlan(params.id)
  return apiResponse.ok({ deleted: true })
}
