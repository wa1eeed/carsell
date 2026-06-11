/**
 * Admin — Plans CRUD
 * GET    /api/v1/admin/plans
 * POST   /api/v1/admin/plans
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { listAllPlans, createPlan } from '@/repositories/plan.repository'

const createPlanSchema = z.object({
  name:          z.string().min(1),
  nameAr:        z.string().min(1),
  slug:          z.string().min(1).regex(/^[a-z0-9-]+$/),
  description:   z.string().optional(),
  descriptionAr: z.string().optional(),
  priceMonthly:  z.number().min(0),
  priceYearly:   z.number().min(0),
  maxCars:       z.number().int().positive().nullable().default(null),
  features: z.object({
    market:        z.boolean().default(false),
    auctions:      z.boolean().default(false),
    api:           z.boolean().default(false),
    reports:       z.enum(['basic', 'advanced', 'full']).default('basic'),
    support:       z.enum(['email', 'chat', 'priority', 'dedicated']).default('email'),
    customShowroom: z.boolean().default(true),
    teamMembers:   z.number().nullable().default(3),
  }),
  isActive:   z.boolean().default(true),
  isPublic:   z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder:  z.number().int().default(0),
  trialDays:  z.number().int().min(0).default(14),
})

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const plans = await listAllPlans()
  return NextResponse.json({ plans })
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = createPlanSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const plan = await createPlan(parsed.data)
  return apiResponse.created({ plan })
}
