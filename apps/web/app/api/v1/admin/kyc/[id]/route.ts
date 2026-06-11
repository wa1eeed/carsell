/**
 * PATCH /api/v1/admin/kyc/[id] — approve or reject a KYC request
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { kycRepository } from '@/repositories/kyc.repository'
import logger from '@/lib/logger'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(1).max(500) }),
])

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') return apiResponse.forbidden()

  const body   = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  if (parsed.data.action === 'approve') {
    await kycRepository.approve(params.id)
    logger.info({ userId: params.id, admin: session.id }, 'kyc.approved')
  } else {
    await kycRepository.reject(params.id, parsed.data.reason)
    logger.info({ userId: params.id, admin: session.id }, 'kyc.rejected')
  }

  return apiResponse.ok({ success: true })
}
