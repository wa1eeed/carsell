/**
 * Nafath Service — نفاذ الوطني
 * المرجع: packages/nafath/nafath-app.yaml
 * مزود الخدمة: إلم (ELM)
 *
 * طريقتان:
 *   1. Web OIDC   ← تسجيل/دخول عبر المتصفح (redirect)
 *   2. App MFA    ← تحقق عبر تطبيق نفاذ (polling)
 */

import { randomUUID }  from 'crypto'
import * as jose       from 'jose'
import { logger }      from '@/lib/logger'
import { AppError }    from '@/lib/errors'

// ─── Config ──────────────────────────────────

const BASE_URL      = process.env.NAFATH_BASE_URL  ?? 'https://api.elm.sa/nafath'
const APP_ID        = process.env.NAFATH_APP_ID    ?? ''
const APP_KEY       = process.env.NAFATH_APP_KEY   ?? ''
const SERVICE_TYPE  = process.env.NAFATH_SERVICE_TYPE ?? 'CarLink'
const TIMEOUT_MS    = 15_000

// ─── Types ────────────────────────────────────

export type NafathIdType = 'citizen' | 'resident' | 'visitor'

export interface NafathUserData {
  nationalId:   string
  nameAr?:      string
  nameEn?:      string
  idType:       NafathIdType
  gender?:      string
  dateOfBirth?: string
}

// MFA status
export type MfaStatus = 'WAITING' | 'EXPIRED' | 'REJECTED' | 'COMPLETED'

export interface MfaSession {
  transId:    string
  random:     string   // رقم يُعرض للمستخدم — يدخله في تطبيق نفاذ
  nationalId: string
}

// Web OIDC session
export interface NafathWebSession {
  sessionId:   number
  redirectUrl: string  // يُعاد توجيه المستخدم هنا
  hashedState: string
  requestId:   string  // requestId أنشأناه — نحفظه للـ callback
}

// ─── HTTP Helper ─────────────────────────────

async function nafathFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!APP_ID || !APP_KEY) {
    throw new AppError('NAFATH_NOT_CONFIGURED', 'نفاذ API غير مُهيَّأ', 503)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'APP-ID':  APP_ID,
        'APP-KEY': APP_KEY,
        'app_id':  APP_ID,
        'app_key': APP_KEY,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      logger.error({ status: res.status, path, body }, 'nafath.http.error')
      throw new AppError('NAFATH_API_ERROR', `نفاذ: خطأ ${res.status}`, res.status >= 500 ? 502 : res.status)
    }

    return await res.json() as T
  } catch (err) {
    if (err instanceof AppError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new AppError('NAFATH_TIMEOUT', 'انتهت مهلة الاتصال بنفاذ', 504)
    }
    logger.error({ err, path }, 'nafath.fetch.failed')
    throw new AppError('NAFATH_CONNECTION_ERROR', 'تعذّر الاتصال بنفاذ', 502)
  } finally {
    clearTimeout(timeout)
  }
}

// ════════════════════════════════════════════
//  Web OIDC Flow (تسجيل / دخول عبر المتصفح)
// ════════════════════════════════════════════

/**
 * الخطوة ١: إنشاء جلسة نفاذ → رابط redirect للمستخدم
 * POST /stg/api/v2/oidc/session
 */
export async function createNafathWebSession(
  locale: 'ar' | 'en' = 'ar'
): Promise<NafathWebSession> {
  const requestId = randomUUID()

  const data = await nafathFetch<{
    id: number
    url: string
    hashedState: string
    requestId: string
  }>(`/stg/api/v2/oidc/session?locale=${locale}&requestId=${requestId}`, {
    method: 'GET',
  })

  logger.info({ requestId }, 'nafath.web.session.created')

  return {
    sessionId:   data.id,
    redirectUrl: data.url,
    hashedState: data.hashedState,
    requestId:   data.requestId,
  }
}

/**
 * الخطوة ٢: بعد عودة المستخدم من نفاذ — استبدال الـ state بـ JWT
 * POST /stg/api/v2/oidc/jwt
 */
export async function exchangeNafathCodeForJwt(
  state: string
): Promise<string> {
  const data = await nafathFetch<{ state: string; token: string }>(
    '/stg/api/v2/oidc/jwt',
    { method: 'POST', body: JSON.stringify({ state }) }
  )

  if (!data.token) {
    throw new AppError('NAFATH_NO_TOKEN', 'لم يتم استلام توكن من نفاذ', 400)
  }

  return data.token
}

/**
 * الخطوة ٣: التحقق من صحة الـ JWT
 * POST /stg/api/v2/oidc/jwt/valid
 */
export async function validateNafathJwt(idToken: string): Promise<boolean> {
  const isValid = await nafathFetch<boolean>(
    '/stg/api/v2/oidc/jwt/valid',
    { method: 'POST', body: JSON.stringify({ id_token: idToken }) }
  )
  return isValid === true
}

/**
 * استخراج بيانات المستخدم من الـ JWT
 * الـ JWT يحتوي claims بيانات الهوية
 */
export function extractUserFromJwt(token: string): NafathUserData {
  try {
    // decode بدون verification (تمّ التحقق بـ validateNafathJwt)
    const payload = jose.decodeJwt(token) as Record<string, unknown>

    const nationalId = String(payload.sub ?? payload.nationalId ?? '')
    if (!nationalId) throw new Error('nationalId missing')

    // تحديد نوع الهوية من أول رقم
    const firstDigit = nationalId[0]
    const idType: NafathIdType =
      firstDigit === '1' ? 'citizen' :
      firstDigit === '2' ? 'resident' : 'visitor'

    return {
      nationalId,
      nameAr:      payload.name_ar    as string | undefined,
      nameEn:      payload.name_en    as string | undefined,
      idType,
      gender:      payload.gender     as string | undefined,
      dateOfBirth: payload.birthdate  as string | undefined,
    }
  } catch (err) {
    logger.error({ err }, 'nafath.jwt.decode.failed')
    throw new AppError('NAFATH_JWT_INVALID', 'فشل استخراج بيانات الهوية من نفاذ', 400)
  }
}

// ════════════════════════════════════════════
//  App MFA Flow (تحقق عبر تطبيق نفاذ)
// ════════════════════════════════════════════

/**
 * الخطوة ١: إنشاء طلب MFA → رقم عشوائي يُعرض للمستخدم
 * POST /api/v1/mfa/request
 */
export async function createMfaRequest(
  nationalId: string
): Promise<MfaSession> {
  const requestId = randomUUID()

  const data = await nafathFetch<{ transId: string; random: string }>(
    `/api/v1/mfa/request?local=ar&requestId=${requestId}`,
    {
      method: 'POST',
      body: JSON.stringify({ nationalId, service: SERVICE_TYPE }),
    }
  )

  logger.info({ nationalId: nationalId.slice(0, 3) + '***' }, 'nafath.mfa.created')

  return {
    transId:    data.transId,
    random:     data.random,
    nationalId,
  }
}

/**
 * الخطوة ٢: استطلاع حالة الطلب
 * POST /api/v1/mfa/request/status
 */
export async function getMfaStatus(session: MfaSession): Promise<MfaStatus> {
  const data = await nafathFetch<{ status: MfaStatus }>(
    '/api/v1/mfa/request/status',
    {
      method: 'POST',
      body: JSON.stringify({
        nationalId: session.nationalId,
        transId:    session.transId,
        random:     session.random,
      }),
    }
  )

  return data.status
}

/**
 * Polling تلقائي حتى COMPLETED أو EXPIRED/REJECTED
 * يُستخدم في Server-Sent Events أو Webhook
 */
export async function pollMfaUntilComplete(
  session: MfaSession,
  intervalMs = 3000,
  maxAttempts = 40  // ~2 دقيقة
): Promise<MfaStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs))
    const status = await getMfaStatus(session)
    if (status !== 'WAITING') return status
  }
  return 'EXPIRED'
}
