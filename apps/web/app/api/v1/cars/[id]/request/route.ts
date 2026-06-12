/**
 * POST /api/v1/cars/[id]/request — public: a buyer submits a request on a car
 * (reservation / soum offer / purchase). No auth required.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiResponse } from '@/lib/api-response'
import { requestRepository } from '@/repositories/request.repository'
import logger from '@/lib/logger'

const schema = z.object({
  type:        z.enum(['RESERVATION', 'SOUM_OFFER', 'PURCHASE']),
  buyerName:   z.string().min(2, 'الاسم مطلوب').max(120),
  buyerPhone:  z.string().regex(/^\+\d{8,15}$/, 'رقم جوال غير صحيح'),
  offerAmount: z.number().positive().optional(),
  message:     z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body   = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.badRequest(parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة')

  // Resolve the car + its showroom; only allow requests on listed cars
  const car = await prisma.car.findFirst({
    where:  { id: params.id, deletedAt: null, status: { in: ['FOR_SALE', 'AUCTION', 'RESERVED'] } },
    select: { id: true, showroomId: true },
  })
  if (!car) return apiResponse.notFound('السيارة غير متاحة')

  // SOUM offer must include an amount
  if (parsed.data.type === 'SOUM_OFFER' && !parsed.data.offerAmount) {
    return apiResponse.badRequest('يجب إدخال مبلغ العرض')
  }

  const request = await requestRepository.create({
    carId:       car.id,
    showroomId:  car.showroomId,
    type:        parsed.data.type,
    buyerName:   parsed.data.buyerName,
    buyerPhone:  parsed.data.buyerPhone,
    offerAmount: parsed.data.offerAmount,
    message:     parsed.data.message,
  })

  logger.info({ carId: car.id, type: parsed.data.type }, 'car.request.created')
  return apiResponse.created({ id: request.id })
}
