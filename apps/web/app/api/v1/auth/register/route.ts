import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { registerSchema } from '@/lib/validations/auth.schema'
import { registerUser } from '@/services/auth.service'

export async function POST(req: NextRequest) {
  return handle(async () => {
    const parsed = registerSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const result = await registerUser(parsed.data)
    return ok(result)
  })
}
