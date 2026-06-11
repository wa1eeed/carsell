/**
 * API Routes للـ VDM
 *
 * POST /api/v1/vdm/lookup      ← البحث (من نموذج الإضافة)
 * POST /api/v1/vdm/sync/:carId ← مزامنة سيارة موجودة (زر التحديث)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma }        from '@/lib/prisma'
import { requireAuth }   from '@/lib/auth-guard'
import { ok, fail }      from '@/lib/api-response'
import { logger }        from '@/lib/logger'
import { AppError }      from '@/lib/errors'
import {
  getVehicleByVin,
  getVehicleBySequenceNumber,
  resolveVdmBrandIds,
} from './vdm.service'

// ─── Schemas ─────────────────────────────────

const lookupSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('vin'),      vin: z.string().min(5).max(17) }),
  z.object({ method: z.literal('sequence'), sequenceNumber: z.string().min(5) }),
])

// ─── POST /api/v1/vdm/lookup ─────────────────
// من نموذج إضافة سيارة جديدة — لا يحفظ شيئاً بعد

export async function POST_vdmLookup(req: NextRequest) {
  await requireAuth(req)

  const body = lookupSchema.safeParse(await req.json())
  if (!body.success) return fail('VALIDATION_ERROR', body.error.message, 422)

  try {
    const vdmData = body.data.method === 'vin'
      ? await getVehicleByVin(body.data.vin)
      : await getVehicleBySequenceNumber(body.data.sequenceNumber)

    if (!vdmData) {
      return fail('VDM_NOT_FOUND', 'لم يتم العثور على بيانات لهذه السيارة في أبشر', 404)
    }

    // محاولة resolve البراند/الفئة/الموديل
    const resolved = await resolveVdmBrandIds(vdmData, prisma)

    return ok({
      // الحقول المُعبَّأة تلقائياً في النموذج
      prefill: {
        vin:               vdmData.vin,
        year:              vdmData.year,
        colorExt:          vdmData.colorExt,
        bodyType:          vdmData.bodyType,
        fuelType:          vdmData.fuelType,
        transmission:      vdmData.transmission,
        plateNumber:       vdmData.plateNumber,
        registrationExpiry: vdmData.registrationExpiry,
        brandId:           resolved.brandId,
        categoryId:        resolved.categoryId,
        modelId:           resolved.modelId,
      },
      // نصوص للعرض في النموذج إذا لم يُحَل الـ ID
      rawText: {
        make:  vdmData.rawMake,
        model: vdmData.rawModel,
        trim:  vdmData.rawTrim,
      },
      // تحذير إذا البراند غير موجود في النظام
      warnings: resolved.unmatchedBrand
        ? [`البراند "${resolved.unmatchedBrand}" غير موجود في النظام — سيُضاف يدوياً`]
        : [],
      // مصدر البيانات ليُحفظ في car.dataSource
      dataSource: body.data.method === 'vin' ? 'VDM_VIN' : 'VDM_ABSHER',
    })

  } catch (err) {
    if (err instanceof AppError) {
      return fail(err.code, err.message, err.status)
    }
    logger.error({ err }, 'vdm.lookup.error')
    return fail('VDM_ERROR', 'خطأ في الاتصال بـ VDM — حاول الإدخال اليدوي', 502)
  }
}

// ─── POST /api/v1/vdm/sync/:carId ────────────
// زر "تحديث من أبشر" في صفحة تفاصيل سيارة يدوية

export async function POST_vdmSync(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)
  const { carId } = params

  // تحقق من ملكية السيارة
  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
  })

  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  // زر التحديث يظهر فقط للسيارات اليدوية
  if (car.dataSource !== 'MANUAL') {
    return fail(
      'VDM_ALREADY_SYNCED',
      'هذه السيارة بياناتها مسحوبة من أبشر مسبقاً',
      400
    )
  }

  if (!car.vin) {
    return fail('VIN_MISSING', 'لا يوجد رقم هيكل — أضفه أولاً لتتمكن من التحديث', 400)
  }

  try {
    const vdmData = await getVehicleByVin(car.vin)

    if (!vdmData) {
      return fail('VDM_NOT_FOUND', 'لم يتم العثور على بيانات لهذه السيارة في أبشر', 404)
    }

    const resolved = await resolveVdmBrandIds(vdmData, prisma)

    // حساب الفروقات (diff) بين البيانات الحالية والجديدة
    const changes = buildDiff(car, vdmData, resolved)

    // إذا لا يوجد أي تغيير
    if (changes.length === 0) {
      return ok({ upToDate: true, changes: [], message: 'البيانات محدّثة — لا يوجد تغيير' })
    }

    // إعادة الفروقات للواجهة — المستخدم يؤكد قبل التطبيق
    return ok({
      upToDate: false,
      changes,                    // عرض diff للمستخدم
      dataSource: 'VDM_VIN',
      rawData: vdmData.rawResponse, // للحفظ في vdmRawData
    })

  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    logger.error({ err, carId }, 'vdm.sync.error')
    return fail('VDM_ERROR', 'خطأ في الاتصال بـ VDM', 502)
  }
}

// ─── POST /api/v1/vdm/sync/:carId/apply ──────
// تطبيق التغييرات بعد موافقة المستخدم على الـ diff

export async function POST_vdmApply(
  req: NextRequest,
  { params }: { params: { carId: string } }
) {
  const user = await requireAuth(req)
  const { carId } = params
  const body = await req.json() as {
    updates: Record<string, unknown>
    dataSource: 'VDM_VIN' | 'VDM_ABSHER'
    rawData: unknown
  }

  const car = await prisma.car.findFirst({
    where: { id: carId, showroomId: user.showroomId, deletedAt: null },
  })
  if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

  // تطبيق التحديثات + تسجيل في التايم لاين
  await prisma.$transaction([
    prisma.car.update({
      where: { id: carId },
      data: {
        ...body.updates,
        dataSource:    body.dataSource,
        vdmLastSyncAt: new Date(),
        vdmRawData:    body.rawData as any,
      },
    }),
    prisma.carTimeline.create({
      data: {
        carId,
        userId:    user.id,
        eventType: 'FIELD_UPDATED',
        payload: {
          source:  'VDM_ABSHER',
          changes: Object.keys(body.updates),
          description: 'تحديث البيانات من أبشر (VDM)',
        },
      },
    }),
  ])

  return ok({ applied: true })
}

// ─── Diff Builder ────────────────────────────

function buildDiff(
  car: any,
  vdmData: any,
  resolved: any
): Array<{ field: string; labelAr: string; current: unknown; updated: unknown }> {
  const checks = [
    { field: 'year',         labelAr: 'سنة الصنع',     vdmVal: vdmData.year },
    { field: 'colorExt',     labelAr: 'اللون',          vdmVal: vdmData.colorExt },
    { field: 'fuelType',     labelAr: 'نوع الوقود',     vdmVal: vdmData.fuelType },
    { field: 'transmission', labelAr: 'ناقل الحركة',    vdmVal: vdmData.transmission },
    { field: 'plateNumber',  labelAr: 'رقم اللوحة',     vdmVal: vdmData.plateNumber },
    { field: 'brandId',      labelAr: 'البراند',        vdmVal: resolved.brandId },
    { field: 'categoryId',   labelAr: 'الفئة',          vdmVal: resolved.categoryId },
    { field: 'modelId',      labelAr: 'الموديل',        vdmVal: resolved.modelId },
  ]

  return checks
    .filter(({ vdmVal, field }) => vdmVal && vdmVal !== car[field])
    .map(({ field, labelAr, vdmVal }) => ({
      field,
      labelAr,
      current: car[field],
      updated: vdmVal,
    }))
}
