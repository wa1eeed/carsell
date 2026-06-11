import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { createSaleSchema } from '@/lib/validations/sale.schema'
import { registerSale } from '@/services/sale.service'

export async function POST(req: NextRequest, { params }: { params: { carId: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = createSaleSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const result = await registerSale(user, params.carId, parsed.data)
    return ok(result)
  })
}
