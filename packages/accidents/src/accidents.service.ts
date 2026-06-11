/**
 * Accidents Service — خدمة استعلام الحوادث (علم / بشر)
 * المرجع: packages/accidents/accident-queries-api.yaml
 * Server: mock-service.api.elm.sa/basher
 */

import { logger }   from '@/lib/logger'
import { AppError } from '@/lib/errors'

const BASE_URL     = process.env.ACCIDENTS_BASE_URL  ?? 'https://api.elm.sa/basher'
const OPERATOR_ID  = process.env.ACCIDENTS_OPERATOR_ID ?? ''
const CLIENT_KEY   = process.env.ACCIDENTS_CLIENT_KEY  ?? ''
const APP_ID       = process.env.ACCIDENTS_APP_ID      ?? ''
const APP_KEY      = process.env.ACCIDENTS_APP_KEY     ?? ''
const TIMEOUT_MS   = 15_000

// ─── Types ────────────────────────────────────

export interface AccidentSub {
  accidentNumber: number
  accidentDate:   string
}

export interface AccidentVehicle {
  make:                  string
  model:                 string
  modelYear:             string
  color:                 string
  plate:                 string
  chassisNumber:         string
  damageStatus:          string
  damagePoint:           string
  damageDescription:     string
  insuranceCompany:      string
  insurancePolicyNumber: string
  numberOfPreviousOwners:number
  imagesTokens:          string[]
}

export interface AccidentPerson {
  nationalId:              string
  firstName:               string
  familyName:              string
  involvementType:         string
  responsibilityPercentage:number
  healthStatus:            string
  hospitalName:            string
}

export interface AccidentInfo {
  accidentNumber:          number
  accidentDate:            number
  accidentTime:            string
  trafficBranchName:       string
  accidentCause:           string
  accidentType:            string
  accidentCity:            string
  streetName:              string
  longitude:               string
  latitude:                string
  accidentDescription:     string
  weatherCondition:        string
  lightingCondition:       string
  roadType:                string
  privateDamages:          string
  publicDamages:           string
  numberOfPartiesInvolved: number
  numberOfInjuredPersons:  number
  imagesTokens:            string[]
  involvedPersons:         AccidentPerson[]
  involvedVehicles:        AccidentVehicle[]
}

// ─── HTTP Helper ─────────────────────────────

async function elmFetch<T>(path: string): Promise<T> {
  if (!OPERATOR_ID || !CLIENT_KEY) {
    throw new AppError('ACCIDENTS_NOT_CONFIGURED', 'خدمة الحوادث غير مُهيَّأة', 503)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Operator-ID': OPERATOR_ID,
        'Operator-id': OPERATOR_ID,
        'client-key':  CLIENT_KEY,
        'app_id':      APP_ID,
        'app_key':     APP_KEY,
      },
      signal: controller.signal,
    })

    if (res.status === 401 || res.status === 403)
      throw new AppError('ACCIDENTS_AUTH_ERROR', 'خطأ في مصادقة خدمة الحوادث', res.status)
    if (res.status === 404) return null as T
    if (!res.ok)
      throw new AppError('ACCIDENTS_API_ERROR', `خطأ من خدمة الحوادث: ${res.status}`, 502)

    return await res.json() as T
  } catch (err) {
    if (err instanceof AppError) throw err
    if ((err as Error).name === 'AbortError')
      throw new AppError('ACCIDENTS_TIMEOUT', 'انتهت مهلة الاتصال بخدمة الحوادث', 504)
    logger.error({ err, path }, 'accidents.fetch.failed')
    throw new AppError('ACCIDENTS_CONNECTION_ERROR', 'تعذّر الاتصال بخدمة الحوادث', 502)
  } finally {
    clearTimeout(timer)
  }
}

// ─── Public API ───────────────────────────────

/**
 * عدد الحوادث للسيارة برقم التسلسل — الأسرع (للعرض المبدئي في التاب)
 * GET /api/v1/accidents-count-by-sequence/{vehicleSequence}
 */
export async function getAccidentCount(
  vehicleSequence: number
): Promise<number> {
  const data = await elmFetch<{ count?: number } | null>(
    `/api/v1/accidents-count-by-sequence/${vehicleSequence}`
  )
  return data?.count ?? 0
}

/**
 * قائمة الحوادث للسيارة برقم التسلسل
 * GET /api/v1/vehicles/{vehicleSequence}/accidents?year={1-5}
 */
export async function getAccidentList(
  vehicleSequence: number,
  years: 1 | 2 | 3 | 4 | 5 = 5
): Promise<AccidentSub[]> {
  return await elmFetch<AccidentSub[]>(
    `/api/v1/vehicles/${vehicleSequence}/accidents?year=${years}`
  ) ?? []
}

/**
 * تفاصيل حادث واحد برقمه
 * GET /api/v1/accidents?accident-number={num}&vehicle-sequence={seq}
 */
export async function getAccidentInfo(
  accidentNumber: number,
  vehicleSequence?: number
): Promise<AccidentInfo | null> {
  const params = new URLSearchParams({
    'accident-number': String(accidentNumber),
    ...(vehicleSequence ? { 'vehicle-sequence': String(vehicleSequence) } : {}),
  })
  return await elmFetch<AccidentInfo>(`/api/v1/accidents?${params}`)
}

/**
 * جلب صورة حادث عبر الـ token
 * GET /api/v1/accidents/images?token={token}
 * يُعيد base64 PNG
 */
export async function getAccidentImage(token: string): Promise<string | null> {
  if (!token) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/accidents/images?token=${encodeURIComponent(token)}`,
      {
        headers: { app_id: APP_ID, app_key: APP_KEY },
        signal: controller.signal,
      }
    )
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
  finally { clearTimeout(timer) }
}
