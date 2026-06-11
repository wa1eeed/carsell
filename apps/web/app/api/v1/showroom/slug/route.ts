/**
 * PUT /api/v1/showroom/slug — change the showroom's public URL handle
 * The handle is used for: carsell.one/{slug} AND {slug}.carsell.one
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { showroomRepository } from '@/repositories/showroom.repository'
import { isReservedSlug } from '@/lib/constants'
import logger from '@/lib/logger'

const schema = z.object({
  slug: z.string()
    .min(3, 'يجب أن يكون 3 أحرف على الأقل')
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
})

export async function PUT(req: NextRequest) {
  const session = await requireAuth()

  const body   = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const slug = parsed.data.slug.toLowerCase()

  // Block reserved words
  if (isReservedSlug(slug)) {
    return apiResponse.badRequest('هذا الاسم محجوز ولا يمكن استخدامه')
  }

  // Check uniqueness
  if (await showroomRepository.isSlugTaken(slug, session.showroomId)) {
    return apiResponse.conflict('هذا الاسم مستخدم من معرض آخر')
  }

  await showroomRepository.updateSlug(session.showroomId, slug)
  logger.info({ showroomId: session.showroomId, slug }, 'showroom.slug.updated')

  return apiResponse.ok({ slug })
}
