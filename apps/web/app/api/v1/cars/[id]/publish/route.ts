import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { publishCarSchema } from '@/lib/validations/car.schema'
import { publishCar } from '@/services/publish.service'
import { canUseFeature } from '@/lib/feature-gate'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user   = await requireAuth()
    const parsed = publishCarSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    // Feature gates per publish mode
    const mode = parsed.data.mode
    if (mode === 'AUCTION') {
      const allowed = await canUseFeature(user.showroomId, 'AUCTIONS')
      if (!allowed) return fail('FEATURE_LOCKED', 'المزادات غير متاحة في باقتك الحالية — ترقّ إلى باقة برو', 403)
    }
    if ('listedOnMarket' in parsed.data && parsed.data.listedOnMarket) {
      const allowed = await canUseFeature(user.showroomId, 'MARKET')
      if (!allowed) return fail('FEATURE_LOCKED', 'CarSell Live غير متاح في باقتك الحالية', 403)
    }

    const result = await publishCar(user, params.id, parsed.data)
    return ok(result)
  })
}
