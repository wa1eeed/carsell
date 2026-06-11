import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { identityManualSchema } from '@/lib/validations/auth.schema'
import { userRepository } from '@/repositories/user.repository'

/**
 * Manual KYC submission (24h review).
 * Nafath-verified users complete the identity step at registration instead.
 */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = identityManualSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    await userRepository.update(user.id, {
      nationalId:     parsed.data.nationalId,
      idExpiryDate:   parsed.data.idExpiryDate,
      kycDocFront:    parsed.data.kycDocFront,
      kycDocBack:     parsed.data.kycDocBack,
      kycStatus:      'PENDING',
      kycSubmittedAt: new Date(),
    })

    // Step marked complete only when KYC is approved by admin; here it is pending.
    return ok({ step: 'identity', status: 'PENDING' })
  })
}
