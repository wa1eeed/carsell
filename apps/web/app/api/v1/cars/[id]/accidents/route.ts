import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { prisma } from '@/lib/prisma'
import { getAccidentCount, getAccidentList } from '@/services/accidents.service'

export const dynamic = 'force-dynamic'

/**
 * Accidents check for a car. Requires vdmSequenceNumber (pull from Absher first).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const car = await carRepository.findById(params.id, user.showroomId)
    if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

    if (!car.vdmSequenceNumber) {
      return fail('NO_SEQUENCE', 'استخدم "سحب من أبشر" أولاً للحصول على رقم التسلسل', 409)
    }

    const sequence = Number(car.vdmSequenceNumber)
    const [count, list] = await Promise.all([getAccidentCount(sequence), getAccidentList(sequence, 5)])

    await prisma.car.updateMany({
      where: { id: params.id, showroomId: user.showroomId },
      data: { accidentsLastCheckAt: new Date(), accidentsCount: count, accidentsCheckYears: 5 },
    })

    return ok({ count, accidents: list, clean: count === 0 })
  })
}
