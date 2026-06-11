import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { requireProfileComplete } from '@/lib/profile'
import { carRepository } from '@/repositories/car.repository'
import { createCar } from '@/services/car.service'
import { carFilterSchema, createCarSchema } from '@/lib/validations/car.schema'
import { canAddCar } from '@/lib/feature-gate'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = carFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const { items, total, page, pageSize } = await listCars(user.showroomId, parsed.data)
    return ok(items, { total, page, pageSize })
  })
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth()
    requireProfileComplete(await completedSteps(user.id), 'car.create')

    const parsed = createCarSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    // Check car limit from plan
    const carCount = await carRepository.countByShowroom(user.showroomId)
    const canAdd = await canAddCar(user.showroomId, carCount)
    if (!canAdd) return fail('PLAN_LIMIT', 'وصلت إلى الحد الأقصى للسيارات في باقتك — ترقّ لإضافة المزيد', 403)

    const car = await createCar(user, parsed.data)
    return ok({ id: car.id })
  })
}

async function listCars(showroomId: string, filters: ReturnType<typeof carFilterSchema.parse>) {
  const { cars, total, page, pageSize } = await carRepository.findByShowroom(showroomId, filters)
  return { items: cars, total, page, pageSize }
}

async function completedSteps(userId: string): Promise<string[]> {
  const { userRepository } = await import('@/repositories/user.repository')
  const user = await userRepository.findById(userId)
  return user?.completedSteps ?? []
}
