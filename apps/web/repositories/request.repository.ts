/**
 * Car Request repository — buyer requests on cars (reservation/soum/purchase).
 * Dealer-scoped reads; public create.
 */

import { prisma } from '@/lib/prisma'
import type { CarRequestType, CarRequestStatus } from '@prisma/client'

export const requestRepository = {
  // ── Dealer (showroom-scoped) ──────────────────────────────────────────────

  async listForShowroom(showroomId: string, opts?: {
    status?: CarRequestStatus
    type?:   CarRequestType
    skip?:   number
    take?:   number
  }) {
    return prisma.carRequest.findMany({
      where: {
        showroomId,
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.type   ? { type:   opts.type   } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
      include: {
        car: {
          select: {
            carRefNumber: true, year: true, sellPrice: true,
            brand:    { select: { nameAr: true, nameEn: true } },
            category: { select: { nameAr: true, nameEn: true } },
            images:   { where: { isCover: true }, take: 1, select: { url: true } },
          },
        },
      },
    })
  },

  async countsForShowroom(showroomId: string) {
    const grouped = await prisma.carRequest.groupBy({
      by:    ['status'],
      where: { showroomId },
      _count: true,
    })
    const map: Record<string, number> = {}
    for (const g of grouped) map[g.status] = g._count
    return {
      pending:   map.PENDING   ?? 0,
      accepted:  map.ACCEPTED  ?? 0,
      rejected:  map.REJECTED  ?? 0,
      completed: map.COMPLETED ?? 0,
      total:     Object.values(map).reduce((a, b) => a + b, 0),
    }
  },

  async findByIdForShowroom(id: string, showroomId: string) {
    return prisma.carRequest.findFirst({ where: { id, showroomId } })
  },

  async updateStatus(id: string, showroomId: string, status: CarRequestStatus, dealerNote?: string) {
    return prisma.carRequest.updateMany({
      where: { id, showroomId },
      data:  { status, ...(dealerNote !== undefined ? { dealerNote } : {}) },
    })
  },

  // ── Public (buyer submits) ────────────────────────────────────────────────

  async create(data: {
    carId:       string
    showroomId:  string
    type:        CarRequestType
    buyerName:   string
    buyerPhone:  string
    offerAmount?: number
    message?:    string
  }) {
    return prisma.carRequest.create({ data })
  },
}
