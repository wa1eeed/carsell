import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { personalInfoSchema } from '@/lib/validations/auth.schema'
import { userRepository } from '@/repositories/user.repository'

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = personalInfoSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    await userRepository.update(user.id, {
      phone:       parsed.data.phone,
      city:        parsed.data.city,
      email:       parsed.data.email,
      dateOfBirth: parsed.data.dateOfBirth,
    })
    await userRepository.addCompletedStep(user.id, 'personalInfo')

    return ok({ step: 'personalInfo', completed: true })
  })
}
