/**
 * Mojaz Routes + External Data Sync
 *
 * POST /api/v1/cars/:carId/mojaz/report  ← توليد/جلب تقرير موجز
 * GET  /api/v1/cars/:carId/mojaz/report  ← حالة آخر تقرير
 *
 * syncExternalData() ← helper مركزي يحدّث حقول السيارة من أي مصدر خارجي
 */

import { NextRequest }      from 'next/server'
import { prisma }           from '@/lib/prisma'
import { requireAuth }      from '@/lib/auth-guard'
import { ok, fail }         from '@/lib/api-response'
import { getStorage }       from '@showroom/storage'
import { AppError }         from '@/lib/errors'
import { logger }           from '@/lib/logger'
import {
  getPdfByVin,
  getPdfBySequence,
  getPdfByRequestId,
  MojazVehicleData,
} from './mojaz.service'

// ─── POST /api/v1/cars/:carId/mojaz/report ────
// يولّد تقرير موجز ويخزّن الـ PDF في R2

export async function POST_mojazReport(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)

  const car = await prisma.car.findFirst({
    where: { id: params.carId, showroomId: user.showroomId, deletedAt: null },
    select: {
      id: true, vin: true,
      vdmRawData: true,
      mojazRequestId: true,
      mojazLastReportAt: true,
    },
  })
  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  // إذا يوجد تقرير حديث (أقل من 24 ساعة) → يُعيده مباشرة
  if (car.mojazLastReportAt) {
    const hoursOld = (Date.now() - car.mojazLastReportAt.getTime()) / 3_600_000
    if (hoursOld < 24 && car.mojazRequestId) {
      return ok({
        cached:    true,
        requestId: car.mojazRequestId,
        message:   'تقرير محدَّث موجود — تم إصداره مؤخراً',
      })
    }
  }

  // استخراج رقم التسلسل من vdmRawData إذا وُجد
  const vdmRaw = car.vdmRawData as Record<string, unknown> | null
  const sequence = vdmRaw?.vehicleSequenceNumber as string | undefined

  if (!car.vin && !sequence)
    return fail('NO_IDENTIFIER', 'يلزم رقم الهيكل أو رقم التسلسل لإصدار تقرير موجز', 400)

  try {
    // طلب تقرير موجز
    const result = sequence
      ? await getPdfBySequence(sequence)
      : await getPdfByVin(car.vin!)

    if (result.resultCode !== 0 || !result.requestId)
      return fail('MOJAZ_REPORT_FAILED', result.resultMessage ?? 'فشل إصدار التقرير', 422)

    // تحديث حقول موجز على السيارة + تسجيل في التايم لاين
    await prisma.$transaction([
      prisma.car.update({
        where: { id: car.id },
        data: {
          mojazRequestId:   result.requestId,
          mojazLastReportAt: new Date(),
          mojazRawData:     result.resultObject as any,
          // تحديث حقول خارجية مستخرجة من نتيجة موجز
          ...(result.resultObject
            ? extractMojazFields(result.resultObject as MojazVehicleData)
            : {}),
        },
      }),
      prisma.carTimeline.create({
        data: {
          carId:     car.id,
          userId:    user.id,
          eventType: 'FILE_UPLOADED',
          payload: {
            source:      'MOJAZ',
            requestId:   result.requestId,
            description: 'إصدار تقرير موجز',
          },
        },
      }),
    ])

    return ok({
      cached:    false,
      requestId: result.requestId,
      message:   'تم إصدار تقرير موجز بنجاح',
    })

  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    logger.error({ err, carId: car.id }, 'mojaz.report.error')
    return fail('MOJAZ_ERROR', 'تعذّر إصدار تقرير موجز', 502)
  }
}

// ─── GET /api/v1/cars/:carId/mojaz/report ─────

export async function GET_mojazReport(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)

  const car = await prisma.car.findFirst({
    where: { id: params.carId, showroomId: user.showroomId, deletedAt: null },
    select: {
      mojazRequestId:    true,
      mojazLastReportAt: true,
      mojazRawData:      true,
    },
  })
  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  if (!car.mojazRequestId)
    return ok({ hasReport: false })

  return ok({
    hasReport:  true,
    requestId:  car.mojazRequestId,
    issuedAt:   car.mojazLastReportAt,
    summary:    car.mojazRawData,
  })
}

// ─── extractMojazFields ───────────────────────
// يستخرج الحقول القابلة للحفظ من بيانات موجز

function extractMojazFields(data: MojazVehicleData): Record<string, unknown> {
  const fields: Record<string, unknown> = {}

  if (data.registrationExpiry) fields.registrationExpiry = parseHijriToDate(data.registrationExpiry)
  if (data.inspectionExpiry)   fields.inspectionExpiry   = parseHijriToDate(data.inspectionExpiry)
  if (data.insuranceExpiry)    fields.insuranceExpiry    = parseHijriToDate(data.insuranceExpiry)
  if (data.insuranceCompany)   fields.insuranceCompany   = data.insuranceCompany
  if (data.insurancePolicyNumber) fields.insurancePolicyNo = data.insurancePolicyNumber
  if (data.numberOfOwners)     fields.numberOfOwners     = data.numberOfOwners
  if (data.odometer)           fields.odometer           = data.odometer

  return fields
}

// التاريخ الهجري → Date (approximation)
function parseHijriToDate(hijri: string): Date | null {
  try {
    // قد يكون الشكل: "1446/03/15" أو "14460315" أو timestamp
    if (/^\d+$/.test(hijri)) return new Date(parseInt(hijri) * 1000) // unix timestamp
    const parts = hijri.replace(/\D/g, ' ').trim().split(/\s+/).map(Number)
    if (parts.length === 3) {
      // تحويل تقريبي من هجري → ميلادي
      const [y, m, d] = parts
      const gregorianYear = Math.round(y - (y - 1) / 33) + 622
      return new Date(gregorianYear, (m || 1) - 1, d || 1)
    }
    return null
  } catch { return null }
}

// ══════════════════════════════════════════════
//  syncExternalData — Helper مركزي
//  يُستدعى بعد أي سحب خارجي (VDM / موجز / حوادث)
//  ويحدّث حقول السيارة + يسجّل في التايم لاين
// ══════════════════════════════════════════════

export type ExternalSource = 'VDM' | 'MOJAZ' | 'ACCIDENTS'

export interface SyncPayload {
  carId:     string
  userId:    string
  source:    ExternalSource
  updates:   Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function syncExternalData(payload: SyncPayload): Promise<void> {
  if (Object.keys(payload.updates).length === 0) return

  await prisma.$transaction([
    prisma.car.update({
      where: { id: payload.carId },
      data:  payload.updates,
    }),
    prisma.carTimeline.create({
      data: {
        carId:     payload.carId,
        userId:    payload.userId,
        eventType: 'FIELD_UPDATED',
        payload: {
          source:      payload.source,
          changedKeys: Object.keys(payload.updates),
          description: `تحديث البيانات من ${payload.source}`,
          ...payload.metadata,
        },
      },
    }),
  ])

  logger.info(
    { carId: payload.carId, source: payload.source, keys: Object.keys(payload.updates) },
    'external.data.synced'
  )
}
