/**
 * KYC repository — platform-admin operations for identity verification review.
 */

import { prisma } from '@/lib/prisma'

export const kycRepository = {
  async listByStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE', opts?: { skip?: number; take?: number }) {
    return prisma.showroomUser.findMany({
      where: { kycStatus: status },
      select: {
        id:              true,
        name:            true,
        email:           true,
        phone:           true,
        nationalId:      true,
        idType:          true,
        accountType:     true,
        kycStatus:       true,
        kycSubmittedAt:  true,
        kycDocFront:     true,
        kycDocBack:      true,
        kycRejectReason: true,
        nafathVerified:  true,
        createdAt:       true,
        showroom:        { select: { id: true, name: true, city: true, showroomNumber: true } },
      },
      orderBy: { kycSubmittedAt: 'asc' },
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
    })
  },

  async counts() {
    const [pending, approved, rejected] = await Promise.all([
      prisma.showroomUser.count({ where: { kycStatus: 'PENDING' } }),
      prisma.showroomUser.count({ where: { kycStatus: 'APPROVED' } }),
      prisma.showroomUser.count({ where: { kycStatus: 'REJECTED' } }),
    ])
    return { pending, approved, rejected }
  },

  async approve(userId: string) {
    return prisma.showroomUser.update({
      where: { id: userId },
      data:  {
        kycStatus:       'APPROVED',
        kycApprovedAt:   new Date(),
        kycRejectReason: null,
        completedSteps:  { push: 'identity' },
      },
    })
  },

  async reject(userId: string, reason: string) {
    return prisma.showroomUser.update({
      where: { id: userId },
      data:  { kycStatus: 'REJECTED', kycRejectReason: reason },
    })
  },
}
