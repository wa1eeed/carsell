/**
 * POST /api/v1/uploads/presign
 *
 * Issues a presigned PUT URL for direct browser → R2 upload.
 *
 * Security enforced:
 *   1. Auth required (JWT)
 *   2. carId must belong to user's showroom (prevents cross-tenant uploads)
 *   3. Upload path is always scoped to showrooms/{showroomId}/... (structural isolation)
 *   4. File type + size validated before issuing URL
 *   5. Presigned URL expires in 10 minutes
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { getStorage, buildCarFileKey, validateFileUpload, getExtFromContentType } from '@/lib/storage'
import { STORAGE_EXPIRY } from '@/lib/constants'

const schema = z.object({
  carId:       z.string().uuid('carId must be a valid UUID').optional(),
  category:    z.enum(['image', 'document']),
  contentType: z.string().min(1).max(100),
  size:        z.number().int().positive().max(50 * 1024 * 1024), // 50 MB absolute cap
  prefix:      z.string().max(40).regex(/^[a-z0-9_-]*$/).optional(),
})

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user   = await requireAuth()
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const { carId, category, contentType, size, prefix } = parsed.data

    // ── Validate file type + size ─────────────────────────────────────────
    const validation = validateFileUpload({ contentType, size, category })
    if (!validation.ok) return fail('FILE_INVALID', validation.error, 422)

    // ── Verify car belongs to this showroom (tenant isolation) ───────────
    let resolvedCarId = carId ?? 'draft'
    if (carId && carId !== 'draft') {
      const car = await prisma.car.findUnique({
        where: { id: carId },
        select: { showroomId: true, deletedAt: true },
      })
      if (!car) return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
      if (car.showroomId !== user.showroomId) {
        return fail('FORBIDDEN', 'هذه السيارة لا تنتمي لمعرضك', 403)
      }
      if (car.deletedAt) return fail('CAR_DELETED', 'السيارة محذوفة', 404)
      resolvedCarId = carId
    }

    // ── Build scoped R2 key ───────────────────────────────────────────────
    // Path: showrooms/{showroomId}/cars/{carId}/{media|docs}/{uuid}.{ext}
    const key = buildCarFileKey({
      showroomId: user.showroomId,
      carId:      resolvedCarId,
      category,
      ext:        getExtFromContentType(contentType),
      prefix,
    })

    // ── Issue presigned URL ───────────────────────────────────────────────
    const slot = await getStorage().createUploadUrl({
      key,
      contentType,
      expiresIn: STORAGE_EXPIRY.UPLOAD_URL,
    })

    return ok(slot)
  })
}
