/**
 * Mojaz Service — تقرير موجز للسيارة
 * المرجع: packages/mojaz/mojaz-partner-api.yaml
 * مزود الخدمة: علم (ELM) — Partner API
 *
 * يوفّر:
 *   1. استعلام بيانات السيارة (VIN أو رقم التسلسل)
 *   2. توليد تقرير PDF موجز
 */

import { logger }   from '@/lib/logger'
import { AppError } from '@/lib/errors'

const BASE_URL  = process.env.MOJAZ_BASE_URL  ?? 'https://api.elm.sa/mojaz'
const APP_ID    = process.env.MOJAZ_APP_ID    ?? ''
const APP_KEY   = process.env.MOJAZ_APP_KEY   ?? ''
const CLIENT_KEY = process.env.MOJAZ_CLIENT_KEY ?? ''
const TIMEOUT_MS = 20_000

// ─── Types ────────────────────────────────────

export interface MojazResult {
  resultCode:    number        // 0 = success
  resultMessage: string
  resultObject:  MojazVehicleData | null
  requestId:     string        // يُستخدم لاحقاً لجلب الـ PDF
}

/**
 * بيانات السيارة من موجز
 * resultObject حقوله غير مُعرَّفة في الـ YAML (additionalProperties)
 * تُحدَّث بعد الاختبار الحقيقي
 */
export interface MojazVehicleData {
  vin?:                   string
  sequenceNumber?:        string
  make?:                  string
  model?:                 string
  modelYear?:             number
  color?:                 string
  bodyType?:              string
  fuelType?:              string
  transmission?:          string
  engineSize?:            string
  plateNumber?:           string
  registrationExpiry?:    string   // Hijri date string
  inspectionExpiry?:      string
  insuranceExpiry?:       string
  insuranceCompany?:      string
  insurancePolicyNumber?: string
  numberOfOwners?:        number
  hasAccidents?:          boolean
  accidentsCount?:        number
  odometer?:              number
  [key: string]: unknown
}

// ─── HTTP Helper ─────────────────────────────

async function mojazFetch<T>(path: string): Promise<T> {
  if (!APP_ID || !APP_KEY) {
    throw new AppError('MOJAZ_NOT_CONFIGURED', 'موجز API غير مُهيَّأ', 503)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'app_id':     APP_ID,
        'app_key':    APP_KEY,
        'app-id':     APP_ID,
        'app-secret': APP_KEY,
        'Client-Key': CLIENT_KEY,
      },
      signal: controller.signal,
    })

    if (res.status === 401 || res.status === 403)
      throw new AppError('MOJAZ_AUTH_ERROR', 'خطأ في مصادقة موجز', res.status)
    if (!res.ok)
      throw new AppError('MOJAZ_API_ERROR', `خطأ من موجز: ${res.status}`, 502)

    return await res.json() as T
  } catch (err) {
    if (err instanceof AppError) throw err
    if ((err as Error).name === 'AbortError')
      throw new AppError('MOJAZ_TIMEOUT', 'انتهت مهلة الاتصال بموجز', 504)
    logger.error({ err, path }, 'mojaz.fetch.failed')
    throw new AppError('MOJAZ_CONNECTION_ERROR', 'تعذّر الاتصال بموجز', 502)
  } finally {
    clearTimeout(timer)
  }
}

// ─── Inquiry ─────────────────────────────────

/** استعلام بـ VIN */
export async function inquireByVin(vin: string): Promise<MojazResult> {
  logger.info({ vin }, 'mojaz.inquiry.vin')
  return mojazFetch<MojazResult>(
    `/api/v1/internal/inquiry/vin?vin=${encodeURIComponent(vin)}`
  )
}

/** استعلام برقم التسلسل */
export async function inquireBySequence(sequence: string): Promise<MojazResult> {
  logger.info({ sequence }, 'mojaz.inquiry.sequence')
  return mojazFetch<MojazResult>(
    `/api/v1/internal/inquiry/sequence?sequence=${encodeURIComponent(sequence)}`
  )
}

// ─── PDF Report ───────────────────────────────

/** توليد تقرير PDF بـ VIN → يُعيد requestId + رابط PDF */
export async function getPdfByVin(vin: string): Promise<MojazResult> {
  logger.info({ vin }, 'mojaz.pdf.vin')
  return mojazFetch<MojazResult>(
    `/api/v1/internal/pdfReportV2/vin?vin=${encodeURIComponent(vin)}`
  )
}

/** توليد تقرير PDF برقم التسلسل */
export async function getPdfBySequence(sequence: string): Promise<MojazResult> {
  logger.info({ sequence }, 'mojaz.pdf.sequence')
  return mojazFetch<MojazResult>(
    `/api/v1/internal/pdfReportV2/sequence?sequence=${encodeURIComponent(sequence)}`
  )
}

/** جلب PDF بـ requestId (من استعلام سابق) */
export async function getPdfByRequestId(requestId: string): Promise<MojazResult> {
  return mojazFetch<MojazResult>(
    `/api/v1/internal/pdfReportV2/request?request=${encodeURIComponent(requestId)}`
  )
}
