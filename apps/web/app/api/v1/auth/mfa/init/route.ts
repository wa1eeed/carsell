import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { createMfaRequest } from '@/services/nafath.service'

const schema = z.object({ nationalId: z.string().min(10).max(11) })

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const session = await createMfaRequest(parsed.data.nationalId)
    return ok(session)
  })
}
