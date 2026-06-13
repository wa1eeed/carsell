/**
 * Car Request repository — buyer requests on cars (reservation/soum/purchase).
 * Dealer-scoped reads; public create.
 */

import { prisma } from '@/lib/prisma'
import type { CarRequestType } from '@prisma/client'

// Extended status type — includes new stages added in migration 20260613
// These values are live in DB after migration; Prisma client types update on next generate
type CarRequestStatus =
  | 'PENDING' | 'RESERVED' | 'WAITING_PAYMENT'
  | 'OWNERSHIP_TRANSFER' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

// Map request status → car status (null = no car status change)
const CAR_STATUS_MAP: Partial<Record<CarRequestStatus, 'RESERVED' | 'FOR_SALE' | 'SOLD'>> = {
  RESERVED:           'RESERVED',
  WAITING_PAYMENT:    'RESERVED',
  OWNERSHIP_TRANSFER: 'RESERVED',
  COMPLETED:          'SOLD',
  REJECTED:           'FOR_SALE',
  CANCELLED:          'FOR_SALE',
}

export const requestRepository = {
  // ── Dealer (showroom-scoped) ──────────────────────────────────────────────

  async listForShowroom(showroomId: string, opts?: {
    status?: CarRequestStatus
    type?:   CarRequestType
    skip?:   number
    take?:   number
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma.carRequest as any).findMany({
      where: {
        showroomId,
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.type   ? { type:   opts.type   } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      include: {
        car: {
          select: {
            carRefNumber: true, year: true, sellPrice: true,
            brand:    { select: { nameAr: true, nameEn: true } },
            category: { select: { nameAr: true, nameEn: true } },
            images:   { where: { isCover: true }, take: 1, select: { url: true } },
          },
        },
      } as any,
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
      pending:           map.PENDING            ?? 0,
      reserved:          map.RESERVED           ?? 0,
      waitingPayment:    map.WAITING_PAYMENT     ?? 0,
      ownershipTransfer: map.OWNERSHIP_TRANSFER  ?? 0,
      completed:         map.COMPLETED           ?? 0,
      rejected:          map.REJECTED            ?? 0,
      cancelled:         map.CANCELLED           ?? 0,
      total:             Object.values(map).reduce((a, b) => a + b, 0),
    }
  },

  async findByIdForShowroom(id: string, showroomId: string) {
    return prisma.carRequest.findFirst({
      where:   { id, showroomId },
      include: { car: { select: { id: true, status: true } } },
    })
  },

  /**
   * Update request status + sync car status + create customer if RESERVED.
   * All changes in a single transaction.
   */
  async updateStatus(
    id:         string,
    showroomId: string,
    status:     CarRequestStatus,
    dealerNote?: string,
  ) {
    // Load request to get carId / buyerName / buyerPhone
    const request = await prisma.carRequest.findFirst({
      where:   { id, showroomId },
      include: { car: { select: { id: true } } },
    })
    if (!request) return { count: 0 }

    const targetCarStatus = CAR_STATUS_MAP[status] ?? null

    return prisma.$transaction(async (tx) => {
      // 1. Update request status (cast needed until migration runs and prisma re-generates)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx.carRequest as any).update({
        where: { id },
        data:  {
          status,
          ...(dealerNote !== undefined ? { dealerNote } : {}),
        },
      })

      // 2. Sync car status
      if (targetCarStatus) {
        await tx.car.update({
          where: { id: request.carId },
          data:  { status: targetCarStatus },
        })

        // Add timeline entry
        const user = await tx.showroomUser.findFirst({ where: { showroomId }, select: { id: true } })
        if (user) {
          await tx.carTimeline.create({
            data: {
              carId:     request.carId,
              userId:    user.id,
              eventType: 'STATUS_CHANGED',
              payload:   {
                from:        null,
                to:          targetCarStatus,
                requestId:   id,
                requestStatus: status,
                buyerName:   request.buyerName,
              },
            },
          })
        }
      }

      // 3. Create/link customer when status = RESERVED
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req = request as any
      if (status === 'RESERVED' && !req.customerId) {
        const existingCustomer = await tx.customer.findFirst({
          where: { showroomId, phone: request.buyerPhone },
        })

        let customerId = existingCustomer?.id
        if (!customerId) {
          const created = await tx.customer.create({
            data: {
              showroomId,
              name:  request.buyerName,
              phone: request.buyerPhone,
            },
          })
          customerId = created.id
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx.carRequest as any).update({
          where: { id },
          data:  { customerId },
        })
      }

      return { count: 1 }
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
