import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import type { RegisterInput } from '@/lib/validations/auth.schema'
import type { NafathUserData } from './nafath.service'
import { startTrial } from './subscription.service'

const BCRYPT_ROUNDS = 12

const ROLE_BY_ACCOUNT: Record<string, 'SHOWROOM_OWNER'> = {
  INDIVIDUAL: 'SHOWROOM_OWNER',
  SHOWROOM:   'SHOWROOM_OWNER',
  AGENCY:     'SHOWROOM_OWNER',
  COMPANY:    'SHOWROOM_OWNER',
}

function mapIdType(t?: string): 'CITIZEN' | 'RESIDENT' | 'VISITOR' | undefined {
  if (!t) return undefined
  const up = t.toUpperCase()
  if (up === 'CITIZEN' || up === 'RESIDENT' || up === 'VISITOR') return up
  return undefined
}

/**
 * Register a new account. Creates a Showroom (tenant container) + owner user.
 * Optionally pre-filled with Nafath identity (then identity step is auto-complete).
 */
export async function registerUser(
  input: RegisterInput,
  nafath?: NafathUserData,
): Promise<{ userId: string; showroomId: string }> {
  if (input.email) {
    const existing = await prisma.showroomUser.findUnique({ where: { email: input.email } })
    if (existing) throw new AppError('EMAIL_TAKEN', 'البريد الإلكتروني مستخدم بالفعل', 409)
  }

  const nationalId = nafath?.nationalId ?? input.nationalId
  if (nationalId) {
    const existing = await prisma.showroomUser.findUnique({ where: { nationalId } })
    if (existing) throw new AppError('NATIONAL_ID_TAKEN', 'رقم الهوية مسجّل بالفعل', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const nafathVerified = !!nafath
  const completedSteps = nafathVerified ? ['identity'] : []

  const result = await prisma.$transaction(async (tx) => {
    // Assign next sequential showroom number (platform-wide, starting at 1001)
    const lastShowroom = await tx.showroom.findFirst({
      orderBy: { showroomNumber: 'desc' },
      select: { showroomNumber: true },
    })
    const nextShowroomNumber = (lastShowroom?.showroomNumber ?? 1000) + 1

    const showroom = await tx.showroom.create({
      data: {
        name:           input.accountType === 'INDIVIDUAL' ? input.name : input.name,
        ownerName:      nafath?.nameAr ?? input.name,
        showroomNumber: nextShowroomNumber,
      },
    })

    const user = await tx.showroomUser.create({
      data: {
        showroomId:       showroom.id,
        name:             nafath?.nameAr ?? input.name,
        email:            input.email ?? `${showroom.id}@pending.carlink.sa`,
        password:         passwordHash,
        phone:            input.phone,
        role:             ROLE_BY_ACCOUNT[input.accountType] ?? 'SHOWROOM_OWNER',
        accountType:      input.accountType,
        completedSteps:   { set: completedSteps },
        nationalId:       nationalId ?? null,
        idType:           mapIdType(nafath?.idType ?? input.idType),
        nafathVerified,
        nafathVerifiedAt: nafathVerified ? new Date() : null,
        nafathRawData:    nafath ? (nafath as unknown as object) : undefined,
        kycStatus:        nafathVerified ? 'APPROVED' : 'NONE',
        kycApprovedAt:    nafathVerified ? new Date() : null,
      },
    })

    return { userId: user.id, showroomId: showroom.id }
  })

  // Start trial subscription if plan selected
  if (input.planId) {
    try {
      await startTrial({
        showroomId:    result.showroomId,
        planId:        input.planId,
        billingPeriod: input.billingPeriod ?? 'MONTHLY',
        userName:      nafath?.nameAr ?? input.name,
        userEmail:     input.email,
        userPhone:     input.phone,
      })
    } catch (err) {
      // Non-fatal — user can select plan later from billing page
      logger.warn({ err, showroomId: result.showroomId }, 'auth.register: failed to start trial, continuing')
    }
  }

  logger.info({ userId: result.userId, accountType: input.accountType, nafath: nafathVerified, planId: input.planId }, 'auth.register.success')
  return result
}
