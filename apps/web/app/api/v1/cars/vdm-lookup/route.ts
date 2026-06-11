import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { lookupVdm } from '@/services/car.service'

const schema = z
  .object({
    vin:      z.string().min(5).max(32).optional(),
    sequence: z.string().min(5).max(20).optional(),
  })
  .refine((d) => d.vin || d.sequence, { message: 'يجب إدخال رقم الهيكل أو رقم التسلسل' })

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireAuth()
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const result = await lookupVdm({ vin: parsed.data.vin, sequence: parsed.data.sequence })
    return ok(result)
  })
}
