import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { timelineRepository } from '@/repositories/timeline.repository'
import { prisma } from '@/lib/prisma'
import { inquireByVin, inquireBySequence, getPdfByVin, getPdfBySequence } from '@/services/mojaz.service'

/**
 * Issue a Mojaz report: inquire for data, generate PDF, store requestId/url,
 * auto-sync fields into the car record, and append a timeline event.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()
    const car = await carRepository.findById(params.id, user.showroomId)
    if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

    const seq = car.vdmSequenceNumber
    if (!car.vin && !seq) return fail('NO_IDENTIFIER', 'يلزم رقم هيكل أو رقم تسلسل', 409)

    const inquiry = car.vin ? await inquireByVin(car.vin) : await inquireBySequence(seq!)
    const pdf = car.vin ? await getPdfByVin(car.vin) : await getPdfBySequence(seq!)

    const data = inquiry.resultObject
    const pdfUrl = (pdf.resultObject?.pdfUrl as string | undefined) ?? null

    await prisma.car.updateMany({
      where: { id: params.id, showroomId: user.showroomId },
      data: {
        mojazRequestId: pdf.requestId ?? inquiry.requestId ?? null,
        mojazLastReportAt: new Date(),
        mojazReportUrl: pdfUrl,
        mojazRawData: (data ?? {}) as object,
        ...(data?.numberOfOwners != null ? { numberOfOwners: data.numberOfOwners } : {}),
        ...(data?.insuranceCompany ? { insuranceCompany: data.insuranceCompany } : {}),
        ...(data?.insurancePolicyNumber ? { insurancePolicyNo: data.insurancePolicyNumber } : {}),
      },
    })

    await timelineRepository.append({
      carId: params.id,
      userId: user.id,
      eventType: 'FIELD_UPDATED',
      payload: { source: 'MOJAZ', action: 'report_issued' },
    })

    return ok({ requestId: pdf.requestId ?? inquiry.requestId, pdfUrl, data })
  })
}
