/**
 * PATCH /api/v1/requests/[id] — dealer accepts/rejects/completes a car request
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { requestRepository } from '@/repositories/request.repository'
import logger from '@/lib/logger'

const schema = z.object({
  status:     z.enum(['RESERVED', 'WAITING_PAYMENT', 'OWNERSHIP_TRANSFER', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const),
  dealerNote: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuth()

  const body   = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const result = await requestRepository.updateStatus(
    params.id, session.showroomId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed.data.status as any,
    parsed.data.dealerNote,
  )
  if (result.count === 0) return apiResponse.notFound('الطلب غير موجود')

  logger.info({ requestId: params.id, status: parsed.data.status }, 'car.request.updated')
  return apiResponse.ok({ updated: true })
}
