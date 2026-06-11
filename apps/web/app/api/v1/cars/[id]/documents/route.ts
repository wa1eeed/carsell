import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { carRepository } from '@/repositories/car.repository'
import { timelineRepository } from '@/repositories/timeline.repository'

const schema = z.object({
  docType:  z.enum(['INSPECTION', 'PURCHASE_INVOICE', 'INSURANCE', 'REGISTRATION', 'PREVIOUS_INVOICE', 'OTHER']),
  fileUrl:  z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireAuth()

    const car = await carRepository.findById(params.id, user.showroomId)
    if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const doc = await carRepository.addDocument(user.showroomId, {
      carId:      params.id,
      docType:    parsed.data.docType,
      fileUrl:    parsed.data.fileUrl,
      fileName:   parsed.data.fileName,
      fileSize:   parsed.data.fileSize,
      uploadedBy: user.id,
    })

    await timelineRepository.append({
      carId: params.id,
      userId: user.id,
      eventType: 'FILE_UPLOADED',
      payload: { docType: parsed.data.docType, fileName: parsed.data.fileName },
    })

    return ok({ id: doc.id })
  })
}
