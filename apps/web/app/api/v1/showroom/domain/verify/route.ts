/**
 * POST /api/v1/showroom/domain/verify
 *
 * Verifies domain ownership by checking the DNS TXT record matches our token.
 * Uses Node's DNS resolver (this route runs in the Node runtime).
 */

import { requireAuth } from '@/lib/auth-guard'
import { apiResponse } from '@/lib/api-response'
import { showroomRepository } from '@/repositories/showroom.repository'
import { resolveTxt } from 'node:dns/promises'
import logger from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST() {
  const session = await requireAuth()

  const settings = await showroomRepository.getUrlSettings(session.showroomId)
  if (!settings?.customDomain || !settings.customDomainToken) {
    return apiResponse.badRequest('لا يوجد دومين مخصص للتحقق منه')
  }

  if (settings.customDomainVerified) {
    return apiResponse.ok({ verified: true, alreadyVerified: true })
  }

  // Look up TXT record at _carsell.{domain}
  const txtName = `_carsell.${settings.customDomain}`
  try {
    const records = await resolveTxt(txtName)
    const flat    = records.flat()  // TXT can be split into chunks
    const found   = flat.some((r) => r.includes(settings.customDomainToken!))

    if (!found) {
      logger.info({ showroomId: session.showroomId, txtName }, 'domain.verify.token_not_found')
      return apiResponse.badRequest('لم نجد سجل التحقق TXT بعد — تأكد من إضافته وانتظر قليلاً (قد يستغرق حتى ساعة)')
    }

    await showroomRepository.markDomainVerified(session.showroomId)
    logger.info({ showroomId: session.showroomId, domain: settings.customDomain }, 'domain.verified')

    return apiResponse.ok({ verified: true })
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return apiResponse.badRequest('لم نجد سجل TXT — تأكد من إضافة السجل في إعدادات DNS')
    }
    logger.error({ err, txtName }, 'domain.verify.dns_error')
    return apiResponse.serverError('تعذّر التحقق من DNS، حاول مرة أخرى')
  }
}
