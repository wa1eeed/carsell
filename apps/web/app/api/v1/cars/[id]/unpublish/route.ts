/**
 * POST /api/v1/cars/[id]/unpublish — stop listing (revert to DRAFT)
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { timelineRepository } from '@/repositories/timeline.repository'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth()

  const car = await prisma.car.findFirst({
    where: { id: params.id, showroomId: user.showroomId, deletedAt: null },
    select: { id: true, status: true },
  })
  if (!car) return apiResponse.notFound('السيارة غير موجودة')
  if (car.status === 'DRAFT' || car.status === 'SOLD') {
    return apiResponse.notFound('السيارة ليست منشورة')
  }

  const prevStatus = car.status

  await prisma.car.update({
    where: { id: car.id },
    data:  {
      status:         'DRAFT',
      listedOnMarket: false,
      displayMode:    'FIXED_PRICE',
    },
  })

  await timelineRepository.append({
    carId:     car.id,
    userId:    user.id,
    eventType: 'STATUS_CHANGED',
    payload:   { from: prevStatus, to: 'DRAFT', action: 'unpublish' },
  })

  return apiResponse.ok({ unpublished: true })
}
