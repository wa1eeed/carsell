/**
 * Custom domain management
 *
 * POST   /api/v1/showroom/domain        — set/connect a custom domain
 * DELETE /api/v1/showroom/domain        — remove the custom domain
 *
 * Verification flow:
 *   1. Dealer enters their domain → we store it + generate a TXT token
 *   2. We return DNS instructions (A record + TXT verification record)
 *   3. Dealer adds the records at their DNS provider
 *   4. POST /api/v1/showroom/domain/verify checks the records
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { showroomRepository } from '@/repositories/showroom.repository'
import logger from '@/lib/logger'

const schema = z.object({
  domain: z.string()
    .min(4)
    .max(253)
    // basic domain validation (no protocol, no path)
    .regex(/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i, 'أدخل دومين صحيح مثل example.com'),
})

export async function POST(req: NextRequest) {
  const session = await requireAuth()

  const body   = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiResponse.validationError(parsed.error)

  const domain = parsed.data.domain.toLowerCase().replace(/^www\./, '')

  // Block carsell.one subdomains
  if (domain.endsWith('carsell.one')) {
    return apiResponse.badRequest('لا يمكن استخدام دومين carsell.one كدومين مخصص')
  }

  // Check uniqueness
  if (await showroomRepository.isDomainTaken(domain, session.showroomId)) {
    return apiResponse.conflict('هذا الدومين مرتبط بمعرض آخر')
  }

  const updated = await showroomRepository.setCustomDomain(session.showroomId, domain)
  logger.info({ showroomId: session.showroomId, domain }, 'showroom.domain.set')

  // DNS instructions — return both A record (for apex) and CNAME (for subdomain)
  const platformIp = process.env.PLATFORM_IP ?? '76.76.21.21'  // example edge IP
  const platformCname = process.env.PLATFORM_CNAME ?? 'cname.carsell.one'

  return apiResponse.created({
    domain:   updated.customDomain,
    verified: false,
    token:    updated.customDomainToken,
    dns: {
      // For apex domain (example.com)
      aRecord: {
        type:  'A',
        name:  '@',
        value: platformIp,
      },
      // For subdomain (www.example.com or shop.example.com)
      cnameRecord: {
        type:  'CNAME',
        name:  'www',
        value: platformCname,
      },
      // Ownership verification
      txtRecord: {
        type:  'TXT',
        name:  '_carsell',
        value: updated.customDomainToken,
      },
    },
  })
}

export async function DELETE() {
  const session = await requireAuth()
  await showroomRepository.removeCustomDomain(session.showroomId)
  logger.info({ showroomId: session.showroomId }, 'showroom.domain.removed')
  return apiResponse.ok({ removed: true })
}
