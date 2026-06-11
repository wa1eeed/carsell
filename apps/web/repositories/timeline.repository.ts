import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type TimelineEventType =
  | 'CAR_CREATED'
  | 'FIELD_UPDATED'
  | 'STATUS_CHANGED'
  | 'FILE_UPLOADED'
  | 'FILE_DELETED'
  | 'SALE_REGISTERED'
  | 'PRICE_CHANGED'
  | 'NOTE_ADDED'

/**
 * Timeline is append-only — never updated or deleted.
 */
export const timelineRepository = {
  async append(params: {
    carId: string
    userId: string
    eventType: TimelineEventType
    payload: Prisma.InputJsonValue
  }) {
    return prisma.carTimeline.create({
      data: {
        carId: params.carId,
        userId: params.userId,
        eventType: params.eventType,
        payload: params.payload,
      },
    })
  },
}
