/**
 * VDM Service — Vehicle Data Management (أبشر)
 * Adapted from packages/vdm/src/vdm.service.ts for the web app.
 *   1. getVehicleByVin(vin)            ← GET /api/v1/vehicles/vehicle-info
 *   2. getVehicleBySequenceNumber(seq) ← POST /api/v2/vehicle/basic-info
 */

import type { PrismaClient } from '@prisma/client'
import logger from '@/lib/logger'
import { AppError } from '@/lib/errors'

const VDM_BASE_URL  = process.env.VDM_BASE_URL  ?? ''
const VDM_CLIENT_ID = process.env.VDM_CLIENT_ID ?? ''
const VDM_APP_ID    = process.env.VDM_APP_ID    ?? ''
const VDM_APP_KEY   = process.env.VDM_APP_KEY   ?? ''
const REQUEST_TIMEOUT_MS = 15_000

export interface VdmVehicleData {
  vin?:                   string
  vehicleSequenceNumber?: string
  make?:                  string
  model?:                 string
  trim?:                  string
  year?:                  number
  color?:                 string
  bodyType?:              string
  fuelType?:              string
  transmission?:          string
  engineSize?:            string
  plateNumber?:           string
  registrationExpiry?:    string
  [key: string]: unknown
}

export interface VdmResponse {
  code: number
  message: string
  data: VdmVehicleData | null
}

export interface VdmMappedData {
  vin?:                string
  year?:               number
  colorExt?:           string
  bodyType?:           string
  fuelType?:           string
  transmission?:       string
  engineSize?:         string
  plateNumber?:        string
  vehicleSequenceNumber?: string
  registrationExpiry?: Date
  rawMake?:            string
  rawModel?:           string
  rawTrim?:            string
  rawResponse:         VdmVehicleData
}

async function vdmFetch(path: string, options: RequestInit): Promise<VdmResponse> {
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

    return (await res.json()) as VdmResponse
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

export async function getVehicleByVin(vin: string): Promise<VdmMappedData | null> {
  logger.info({ vin }, 'vdm.lookup.byVin')
  const response = await vdmFetch(`/api/v1/vehicles/vehicle-info?vin=${encodeURIComponent(vin)}`, { method: 'GET' })
  return handleVdmResponse(response, { vin })
}

export async function getVehicleBySequenceNumber(vehicleSequenceNumber: string): Promise<VdmMappedData | null> {
  logger.info({ vehicleSequenceNumber }, 'vdm.lookup.bySequence')
  const response = await vdmFetch('/api/v2/vehicle/basic-info', {
    method: 'POST',
    body: JSON.stringify({ vehicleSequenceNumber }),
  })
  return handleVdmResponse(response, { vehicleSequenceNumber })
}

function handleVdmResponse(response: VdmResponse, context: Record<string, string>): VdmMappedData | null {
  if (response.code === 1 || !response.data) {
    logger.info({ ...context, message: response.message }, 'vdm.notFound')
    return null
  }
  return mapVdmToCarFields(response.data)
}

function mapVdmToCarFields(data: VdmVehicleData): VdmMappedData {
  return {
    vin:                   data.vin,
    year:                  data.year ? Number(data.year) : undefined,
    colorExt:              data.color,
    bodyType:              normalizeBodyType(data.bodyType),
    fuelType:              normalizeFuelType(data.fuelType),
    transmission:          normalizeTransmission(data.transmission),
    engineSize:            data.engineSize,
    plateNumber:           data.plateNumber,
    vehicleSequenceNumber: data.vehicleSequenceNumber,
    registrationExpiry:    data.registrationExpiry ? new Date(data.registrationExpiry) : undefined,
    rawMake:               data.make,
    rawModel:              data.model,
    rawTrim:               data.trim,
    rawResponse:           data,
  }
}

function normalizeBodyType(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    suv: 'SUV', 'sport utility': 'SUV',
    sedan: 'SEDAN', سيدان: 'SEDAN',
    pickup: 'PICKUP', 'بيك آب': 'PICKUP',
    coupe: 'COUPE', كوبيه: 'COUPE',
    hatchback: 'HATCHBACK',
    van: 'VAN',
  }
  return map[raw.toLowerCase()] ?? raw
}

function normalizeFuelType(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    gasoline: 'PETROL', petrol: 'PETROL', بنزين: 'PETROL',
    diesel: 'DIESEL', ديزل: 'DIESEL',
    hybrid: 'HYBRID', هجين: 'HYBRID',
    electric: 'ELECTRIC', كهربائي: 'ELECTRIC',
  }
  return map[raw.toLowerCase()] ?? raw
}

function normalizeTransmission(raw?: string): string | undefined {
  if (!raw) return undefined
  const map: Record<string, string> = {
    automatic: 'AUTOMATIC', أوتوماتيك: 'AUTOMATIC', auto: 'AUTOMATIC',
    manual: 'MANUAL', يدوي: 'MANUAL',
  }
  return map[raw.toLowerCase()] ?? raw
}

export interface ResolvedBrandIds {
  brandId?: string
  categoryId?: string
  modelId?: string
  unmatchedBrand?: string
}

export async function resolveVdmBrandIds(mapped: VdmMappedData, prisma: PrismaClient): Promise<ResolvedBrandIds> {
  if (!mapped.rawMake) return {}

  const brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { nameEn: { equals: mapped.rawMake, mode: 'insensitive' } },
        { nameAr: { equals: mapped.rawMake, mode: 'insensitive' } },
      ],
    },
  })

  if (!brand) return { unmatchedBrand: mapped.rawMake }

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

  const model =
    category && mapped.rawTrim
      ? await prisma.model.findFirst({
          where: { categoryId: category.id, name: { equals: mapped.rawTrim, mode: 'insensitive' } },
        })
      : null

  return { brandId: brand.id, categoryId: category?.id, modelId: model?.id }
}
