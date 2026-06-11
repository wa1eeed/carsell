/**
 * Admin Platform Settings — GET + PUT
 * Handles Tap API keys and other platform config
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { listPlatformSettings, setPlatformSetting } from '@/repositories/plan.repository'

const updateSchema = z.object({
  settings: z.array(z.object({
    key:      z.string().min(1),
    value:    z.string(),
    isSecret: z.boolean().default(false),
  })),
})

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const settings = await listPlatformSettings(true)
  // Mask secret values
  const masked = settings.map((s) => ({
    key:      s.key,
    value:    s.isSecret ? maskSecret(s.value) : s.value,
    isSecret: s.isSecret,
    updatedAt: s.updatedAt,
  }))
  return NextResponse.json({ settings: masked })
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return apiResponse.unauthorized()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body = await req.json() as unknown
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  await Promise.all(
    parsed.data.settings.map((s) =>
      setPlatformSetting(s.key, s.value, { isSecret: s.isSecret, updatedBy: session.id }),
    ),
  )

  return apiResponse.ok({ updated: parsed.data.settings.length })
}

function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 7) + '••••••••' + value.slice(-4)
}
