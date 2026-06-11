import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { applyVdmSync } from '@/services/car.service'

const schema = z.object({
  brandId:    z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  modelId:    z.string().uuid().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    await applyVdmSync(user, params.id, parsed.data)
    return ok({ synced: true })
  })
}
