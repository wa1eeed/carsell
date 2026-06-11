import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { updateCar, softDeleteCar } from '@/services/car.service'
import { updateCarSchema } from '@/lib/validations/car.schema'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const car = await carRepository.findById(params.id, user.showroomId)
    if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
    return ok(car)
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = updateCarSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const car = await updateCar(user, params.id, parsed.data)
    return ok({ id: car.id })
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    await softDeleteCar(user, params.id)
    return ok({ deleted: true })
  })
}
