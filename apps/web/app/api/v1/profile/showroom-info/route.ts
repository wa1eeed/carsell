import { NextRequest } from 'next/server'
import { handle } from '@/lib/route-handler'
import { ok, fail } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth-guard'
import { showroomInfoSchema } from '@/lib/validations/auth.schema'
import { prisma } from '@/lib/prisma'
import { userRepository } from '@/repositories/user.repository'

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireAuth()
    const parsed = showroomInfoSchema.safeParse(await req.json())
    if (!parsed.success) return fail('VALIDATION_ERROR', parsed.error.message, 422)

    const d = parsed.data

    // Generate a unique public slug from the name on first completion.
    const current = await prisma.showroom.findUnique({ where: { id: user.showroomId }, select: { slug: true } })
    let slug = current?.slug ?? null
    if (!slug) {
      const base = slugify(d.name) || 'showroom'
      slug = base
      let n = 1
      // ensure uniqueness
      while (await prisma.showroom.findUnique({ where: { slug } })) {
        slug = `${base}-${++n}`
      }
    }

    await prisma.showroom.update({
      where: { id: user.showroomId },
      data: {
        slug,
        name:             d.name,
        activityType:     d.activityType,
        city:             d.city,
        district:         d.district,
        commercialReg:    d.commercialReg,
        vatNumber:        d.vatNumber,
        whatsapp:         d.whatsapp,
        instagramUrl:     d.instagramUrl,
        logoUrl:          d.logoUrl,
        commercialRegDoc: d.commercialRegDoc,
      },
    })
    await userRepository.addCompletedStep(user.id, 'showroomInfo')

    return ok({ step: 'showroomInfo', completed: true, slug })
  })
}

/** Latin/Arabic-safe slug: keep latin alphanumerics, collapse the rest to dashes. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
