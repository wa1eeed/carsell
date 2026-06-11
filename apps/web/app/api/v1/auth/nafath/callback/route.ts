import { NextRequest, NextResponse } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import {
  exchangeNafathCodeForJwt,
  validateNafathJwt,
  extractUserFromJwt,
} from '@/services/nafath.service'
import { userRepository } from '@/repositories/user.repository'

export const dynamic = 'force-dynamic'

/**
 * Nafath OIDC callback.
 * Exchanges state → JWT, validates, extracts identity.
 * If the national ID already maps to a user → returns existing (login).
 * Otherwise → returns prefill data for the register screen.
 */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const state = req.nextUrl.searchParams.get('state')
    if (!state) return fail('MISSING_STATE', 'الحالة مفقودة', 400)

    const jwt = await exchangeNafathCodeForJwt(state)
    const valid = await validateNafathJwt(jwt)
    if (!valid) return fail('NAFATH_JWT_INVALID', 'توكن نفاذ غير صالح', 400)

    const identity = extractUserFromJwt(jwt)
    const existing = await userRepository.findByNationalId(identity.nationalId)

    if (existing) {
      return ok({ mode: 'login', userId: existing.id })
    }

    return ok({
      mode: 'register',
      prefill: {
        name:       identity.nameAr ?? identity.nameEn ?? '',
        nationalId: identity.nationalId,
        idType:     identity.idType.toUpperCase(),
      },
    })
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return GET(req)
}
