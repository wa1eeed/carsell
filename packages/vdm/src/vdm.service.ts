/**
 * VDM Service — Vehicle Data Management (أبشر)
 * المرجع: packages/vdm/vehicle-vdm-apis.yaml
 *
 * يوفّر طريقتين للبحث:
 *   1. byVin(vin)               ← GET /api/v1/vehicles/vehicle-info
 *   2. bySequenceNumber(seq)    ← POST /api/v2/vehicle/basic-info
 */

import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

// ─── Config ──────────────────────────────────

const VDM_BASE_URL  = process.env.VDM_BASE_URL  ?? ''
const VDM_CLIENT_ID = process.env.VDM_CLIENT_ID ?? ''
const VDM_APP_ID    = process.env.VDM_APP_ID    ?? ''
const VDM_APP_KEY   = process.env.VDM_APP_KEY   ?? ''

// timeout للاستدعاء — VDM API حكومي قد يكون بطيئاً
const REQUEST_TIMEOUT_MS = 15_000

// ─── Types ────────────────────────────────────

/**
 * البيانات المُعادة من VDM
 * الحقول الفعلية additionalProperties: true في الـ YAML
 * تُحدَّث هذه الـ interface بعد الاختبار الحقيقي مع الـ API
 */
export interface VdmVehicleData {
  vin?:                 string
  vehicleSequenceNumber?: string
  make?:                string   // البراند — مثل "Toyota"
  model?:               string   // الفئة — مثل "Land Cruiser"
  trim?:                string   // الموديل — مثل "VXR"
  year?:                number   // سنة الصنع
  color?:               string   // اللون
  bodyType?:            string   // نوع الهيكل
  fuelType?:            string   // نوع الوقود
  transmission?:        string   // ناقل الحركة
  engineSize?:          string   // حجم المحرك
  plateNumber?:         string   // رقم اللوحة
  registrationExpiry?:  string   // انتهاء الاستمارة (ISO date)
  // يُضاف المزيد بعد الاختبار
  [key: string]: unknown         // بيانات إضافية يعيدها الـ API
}

export interface VdmResponse {
  code: number      // 0 = success, 1 = not found / error
  message: string
  data: VdmVehicleData | null
}

/**
 * البيانات بعد التحويل لحقول جدول Car
 * جاهزة للمقارنة مع البيانات الموجودة أو للحفظ مباشرة
 */
export interface VdmMappedData {
  vin?:               string
  year?:              number
  colorExt?:          string
  bodyType?:          string
  fuelType?:          string
  transmission?:      string
  plateNumber?:       string
  registrationExpiry?: Date
  // براند/فئة/موديل تحتاج lookup — تُرجَع كنصوص
  rawMake?:           string
  rawModel?:          string
  rawTrim?:           string
  // البيانات الخام للحفظ في car.vdmRawData
  rawResponse:        VdmVehicleData
}

// ─── HTTP Helper ─────────────────────────────

async function vdmFetch(
  path: string,
  options: RequestInit
): Promise<VdmResponse> {
  if (!VDM_BASE_URL || !VDM_CLIENT_ID) {
    throw new AppError('VDM_NOT_CONFIGURED', 'VDM API غير مُهيَّأ — تحقق من متغيرات البيئة', 503)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${VDM_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'client-id': VDM_CLIENT_ID,
        'app_id':    VDM_APP_ID,
        'app_key':   VDM_APP_KEY,
        ...options.headers,
      },
    })

    if (res.status === 401) throw new AppError('VDM_UNAUTHORIZED', 'بيانات اعتماد VDM غير صحيحة', 401)
    if (res.status === 403) throw new AppError('VDM_FORBIDDEN', 'لا صلاحية للوصول لـ VDM', 403)
    if (res.status >= 500) throw new AppError('VDM_SERVER_ERROR', 'خطأ في خادم VDM', 502)

    return await res.json() as VdmResponse

  } catch (err) {
    if (err instanceof AppError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new AppError('VDM_TIMEOUT', 'انتهت مهلة الاتصال بـ VDM', 504)
    }
    logger.error({ err, path }, 'vdm.fetch.failed')
    throw new AppError('VDM_CONNECTION_ERROR', 'تعذّر الاتصال بـ VDM', 502)
  } finally {
    clearTimeout(timeout)
  }
}

// ─── VDM Service ─────────────────────────────

/**
 * البحث برقم الهيكل (VIN)
 * GET /api/v1/vehicles/vehicle-info?vin={vin}
 */
export async function getVehicleByVin(
  vin: string
): Promise<VdmMappedData | null> {
  logger.info({ vin }, 'vdm.lookup.byVin')

  const response = await vdmFetch(
    `/api/v1/vehicles/vehicle-info?vin=${encodeURIComponent(vin)}`,
    { method: 'GET' }
  )

  return handleVdmResponse(response, { vin })
}

/**
 * البحث برقم التسلسل (رقم أبشر)
 * POST /api/v2/vehicle/basic-info
 */
export async function getVehicleBySequenceNumber(
  vehicleSequenceNumber: string
): Promise<VdmMappedData | null> {
  logger.info({ vehicleSequenceNumber }, 'vdm.lookup.bySequence')

  const response = await vdmFetch('/api/v2/vehicle/basic-info', {
    method: 'POST',
    body: JSON.stringify({ vehicleSequenceNumber }),
  })

  return handleVdmResponse(response, { vehicleSequenceNumber })
}

// ─── Response Handler ────────────────────────

function handleVdmResponse(
  response: VdmResponse,
  context: Record<string, string>
): VdmMappedData | null {
  // code: 1 = not found (VDM convention)
  if (response.code === 1 || !response.data) {
    logger.info({ ...context, message: response.message }, 'vdm.notFound')
    return null
  }

  return mapVdmToCarFields(response.data)
}

// ─── Field Mapping ────────────────────────────

/**
 * تحويل بيانات VDM لحقول جدول Car
 * النصوص مثل make/model/trim تُرجَع كـ rawMake/rawModel/rawTrim
 * لأنها تحتاج lookup في جدول brands/categories/models
 */
function mapVdmToCarFields(data: VdmVehicleData): VdmMappedData {
  return {
    vin:               data.vin,
    year:              data.year ? Number(data.year) : undefined,
    colorExt:          data.color,
    bodyType:          normalizeBodyType(data.bodyType),
    fuelType:          normalizeFuelType(data.fuelType),
    transmission:      normalizeTransmission(data.transmission),
    plateNumber:       data.plateNumber,
    registrationExpiry: data.registrationExpiry
      ? new Date(data.registrationExpiry)
      : undefined,
    rawMake:           data.make,
    rawModel:          data.model,
    rawTrim:           data.trim,
    rawResponse:       data,
  }
}

// ─── Normalizers ─────────────────────────────

function normalizeBodyType(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    'suv': 'SUV', 'sport utility': 'SUV',
    'sedan': 'SEDAN', 'سيدان': 'SEDAN',
    'pickup': 'PICKUP', 'بيك آب': 'PICKUP',
    'coupe': 'COUPE', 'كوبيه': 'COUPE',
    'hatchback': 'HATCHBACK',
    'van': 'VAN',
  }
  return map[raw.toLowerCase()] ?? raw
}

function normalizeFuelType(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    'gasoline': 'PETROL', 'petrol': 'PETROL', 'بنزين': 'PETROL',
    'diesel': 'DIESEL', 'ديزل': 'DIESEL',
    'hybrid': 'HYBRID', 'هجين': 'HYBRID',
    'electric': 'ELECTRIC', 'كهربائي': 'ELECTRIC',
  }
  return map[raw.toLowerCase()] ?? raw
}

function normalizeTransmission(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    'automatic': 'AUTOMATIC', 'أوتوماتيك': 'AUTOMATIC', 'auto': 'AUTOMATIC',
    'manual': 'MANUAL', 'يدوي': 'MANUAL',
  }
  return map[raw.toLowerCase()] ?? raw
}

// ─── Brand/Model Resolver ────────────────────

/**
 * يحاول إيجاد brandId/categoryId/modelId من البيانات النصية
 * يُستخدم بعد getVehicleByVin/getVehicleBySequenceNumber
 */
export async function resolveVdmBrandIds(
  mapped: VdmMappedData,
  prisma: any // PrismaClient
): Promise<{
  brandId?: string
  categoryId?: string
  modelId?: string
  unmatchedBrand?: string   // إذا لم يُجَد — يحتاج إضافة من الأدمن
}> {
  if (!mapped.rawMake) return {}

  const brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { nameEn: { equals: mapped.rawMake, mode: 'insensitive' } },
        { nameAr: { equals: mapped.rawMake, mode: 'insensitive' } },
      ],
    },
  })

  if (!brand) {
    return { unmatchedBrand: mapped.rawMake }
  }

  const category = mapped.rawModel
    ? await prisma.category.findFirst({
        where: {
          brandId: brand.id,
          OR: [
            { nameEn: { equals: mapped.rawModel, mode: 'insensitive' } },
            { nameAr: { equals: mapped.rawModel, mode: 'insensitive' } },
          ],
        },
      })
    : null

  const model = category && mapped.rawTrim
    ? await prisma.model.findFirst({
        where: {
          categoryId: category.id,
          name: { equals: mapped.rawTrim, mode: 'insensitive' },
        },
      })
    : null

  return {
    brandId:    brand?.id,
    categoryId: category?.id,
    modelId:    model?.id,
  }
}
