/**
 * Nafath Auth Routes
 *
 * GET  /api/v1/auth/nafath/session   ← إنشاء جلسة Web OIDC
 * POST /api/v1/auth/nafath/callback  ← callback بعد رجوع المستخدم
 * POST /api/v1/auth/nafath/mfa/init  ← بدء MFA (App flow)
 * GET  /api/v1/auth/nafath/mfa/status← استطلاع حالة MFA
 */

import { NextRequest, NextResponse } from 'next/server'
import { z }              from 'zod'
import { prisma }         from '@/lib/prisma'
import { ok, fail }       from '@/lib/api-response'
import { logger }         from '@/lib/logger'
import { AppError }       from '@/lib/errors'
import { signJwt }        from '@/lib/auth'     // NextAuth JWT helper
import {
  createNafathWebSession,
  exchangeNafathCodeForJwt,
  validateNafathJwt,
  extractUserFromJwt,
  createMfaRequest,
  getMfaStatus,
  NafathUserData,
} from './nafath.service'

// ─── GET /api/v1/auth/nafath/session ─────────
// يُنشئ جلسة نفاذ ويُعيد رابط الـ redirect

export async function GET_nafathSession(req: NextRequest) {
  const locale = (req.nextUrl.searchParams.get('locale') ?? 'ar') as 'ar' | 'en'

  try {
    const session = await createNafathWebSession(locale)

    // نحفظ requestId في cookie لنتحقق منه في الـ callback
    const res = ok({
      redirectUrl: session.redirectUrl,
      requestId:   session.requestId,
    })
    res.cookies.set('nafath_request_id', session.requestId, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   300, // 5 دقائق
      sameSite: 'lax',
    })
    return res
  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    return fail('NAFATH_ERROR', 'تعذّر الاتصال بنفاذ', 502)
  }
}

// ─── POST /api/v1/auth/nafath/callback ───────
// بعد رجوع المستخدم من صفحة نفاذ

const callbackSchema = z.object({
  state: z.string().min(1),
})

export async function POST_nafathCallback(req: NextRequest) {
  const body = callbackSchema.safeParse(await req.json())
  if (!body.success) return fail('VALIDATION_ERROR', 'state مطلوب', 422)

  try {
    // استبدال الـ state بـ JWT
    const token = await exchangeNafathCodeForJwt(body.data.state)

    // التحقق من صحة الـ JWT
    const isValid = await validateNafathJwt(token)
    if (!isValid) return fail('NAFATH_JWT_INVALID', 'توكن نفاذ غير صالح', 401)

    // استخراج بيانات الهوية
    const userData = extractUserFromJwt(token)

    // إيجاد أو إنشاء الحساب
    const { user, isNew } = await findOrCreateUser(userData)

    // إنشاء جلسة المنصة
    const sessionToken = await signJwt({
      userId:     user.id,
      showroomId: user.showroomId,
      role:       user.role,
    })

    logger.info({ userId: user.id, isNew }, 'nafath.auth.success')

    return ok({ sessionToken, isNew, user: { id: user.id, name: user.name } })

  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    logger.error({ err }, 'nafath.callback.error')
    return fail('NAFATH_AUTH_FAILED', 'فشل التحقق من نفاذ', 500)
  }
}

// ─── POST /api/v1/auth/nafath/mfa/init ───────
// بدء MFA عبر التطبيق المحمول

const mfaInitSchema = z.object({
  nationalId: z.string().regex(/^[1234569]\d{9}$/),
})

export async function POST_nafathMfaInit(req: NextRequest) {
  const body = mfaInitSchema.safeParse(await req.json())
  if (!body.success) return fail('VALIDATION_ERROR', 'رقم الهوية غير صحيح', 422)

  try {
    const session = await createMfaRequest(body.data.nationalId)

    return ok({
      transId: session.transId,
      random:  session.random,   // الرقم الذي يُعرض للمستخدم
      message: `أدخل الرقم ${session.random} في تطبيق نفاذ`,
    })
  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    return fail('NAFATH_MFA_FAILED', 'تعذّر إنشاء طلب نفاذ', 502)
  }
}

// ─── GET /api/v1/auth/nafath/mfa/status ──────
// استطلاع حالة MFA — يُستدعى كل 3 ثوانٍ من الواجهة

const mfaStatusSchema = z.object({
  nationalId: z.string(),
  transId:    z.string().uuid(),
  random:     z.string().regex(/^\d{2}$/),
})

export async function GET_nafathMfaStatus(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const body = mfaStatusSchema.safeParse(params)
  if (!body.success) return fail('VALIDATION_ERROR', 'بيانات غير صحيحة', 422)

  try {
    const status = await getMfaStatus({
      nationalId: body.data.nationalId,
      transId:    body.data.transId,
      random:     body.data.random,
    })

    // عند COMPLETED → إنشاء جلسة
    if (status === 'COMPLETED') {
      const userData: NafathUserData = {
        nationalId: body.data.nationalId,
        idType:     body.data.nationalId[0] === '1' ? 'citizen' :
                    body.data.nationalId[0] === '2' ? 'resident' : 'visitor',
      }
      const { user, isNew } = await findOrCreateUser(userData)
      const sessionToken = await signJwt({
        userId: user.id, showroomId: user.showroomId, role: user.role,
      })
      return ok({ status, sessionToken, isNew })
    }

    return ok({ status })

  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.status)
    return fail('NAFATH_STATUS_FAILED', 'تعذّر التحقق من حالة نفاذ', 502)
  }
}

// ─── Helper: findOrCreateUser ────────────────

async function findOrCreateUser(nafathData: NafathUserData) {
  const existing = await prisma.showroomUser.findFirst({
    where: { nationalId: nafathData.nationalId },
  })

  if (existing) return { user: existing, isNew: false }

  // مستخدم جديد — حساب فرد بدون معرض
  const created = await prisma.showroomUser.create({
    data: {
      name:       nafathData.nameAr ?? nafathData.nameEn ?? 'مستخدم نفاذ',
      email:      `nafath_${nafathData.nationalId}@carlink.noemail`,
      password:   '',          // لا كلمة مرور — يسجل دخول فقط بنفاذ
      role:       'SHOWROOM_OWNER',
      nationalId: nafathData.nationalId,
      idType:     nafathData.idType,
      nafathVerified: true,
      nafathVerifiedAt: new Date(),
      showroomId: null as any, // يُكمل إعداد معرضه لاحقاً
    },
  })

  logger.info({ userId: created.id }, 'nafath.user.created')
  return { user: created, isNew: true }
}
