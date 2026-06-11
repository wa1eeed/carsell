/**
 * Accidents API Routes
 *
 * GET /api/v1/cars/:carId/accidents         ← قائمة الحوادث
 * GET /api/v1/cars/:carId/accidents/:accNum ← تفاصيل حادث واحد
 */

import { NextRequest }       from 'next/server'
import { prisma }            from '@/lib/prisma'
import { requireAuth }       from '@/lib/auth-guard'
import { ok, fail }          from '@/lib/api-response'
import { AppError }          from '@/lib/errors'
import { z }                 from 'zod'
import {
  getAccidentCount,
  getAccidentList,
  getAccidentInfo,
} from './accidents.service'

// ─── GET /api/v1/cars/:carId/accidents ───────

const listSchema = z.object({
  years: z.coerce.number().int().min(1).max(5).default(5),
})

export async function GET_accidentList(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)

  const car = await prisma.car.findFirst({
    where: { id: params.carId, showroomId: user.showroomId, deletedAt: null },
    select: { id: true, vin: true },
  })
  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  // نحتاج vehicleSequence — يُستخرج من VDM أو يُخزَّن على السيارة
  const vehicleSequence = await getVehicleSequence(car.id)
  if (!vehicleSequence)
    return fail('NO_SEQUENCE', 'رقم التسلسل غير متوفر — استخدم "سحب من أبشر" أولاً', 400)

  const query = listSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  )
  if (!query.success) return fail('VALIDATION_ERROR', query.error.message, 422)

  try {
    const [count, accidents] = await Promise.all([
      getAccidentCount(vehicleSequence),
      getAccidentList(vehicleSequence, query.data.years as 1|2|3|4|5),
    ])
    return ok({ count, accidents, years: query.data.years })
  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    return fail('ACCIDENTS_ERROR', 'تعذّر جلب بيانات الحوادث', 502)
  }
}

// ─── GET /api/v1/cars/:carId/accidents/:num ──

export async function GET_accidentDetail(
  req: NextRequest,
  { params }: { params: { carId: string; accidentNumber: string } }
) {
  const user = await requireAuth(req)

  const car = await prisma.car.findFirst({
    where: { id: params.carId, showroomId: user.showroomId, deletedAt: null },
    select: { id: true },
  })
  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  const accidentNumber = Number(params.accidentNumber)
  if (!accidentNumber) return fail('VALIDATION_ERROR', 'رقم الحادث غير صحيح', 422)

  const vehicleSequence = await getVehicleSequence(car.id)

  try {
    const info = await getAccidentInfo(accidentNumber, vehicleSequence ?? undefined)
    if (!info) return fail('ACCIDENT_NOT_FOUND', 'الحادث غير موجود', 404)
    return ok(info)
  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    return fail('ACCIDENTS_ERROR', 'تعذّر جلب تفاصيل الحادث', 502)
  }
}

// ─── Helper ───────────────────────────────────

async function getVehicleSequence(carId: string): Promise<number | null> {
  // vehicleSequence يُخزَّن في vdmRawData عند السحب من أبشر
  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: { vdmRawData: true },
  })
  const raw = car?.vdmRawData as Record<string, unknown> | null
  return raw?.vehicleSequenceNumber
    ? Number(raw.vehicleSequenceNumber)
    : null
}
