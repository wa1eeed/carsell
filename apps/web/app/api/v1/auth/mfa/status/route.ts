import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { getMfaStatus } from '@/services/nafath.service'

const schema = z.object({
  nationalId: z.string().min(10).max(11),
  transId:    z.string().min(1),
  random:     z.string().min(1),
})

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة', 422)

    const status = await getMfaStatus(parsed.data)
    return ok({ status })
  })
}
