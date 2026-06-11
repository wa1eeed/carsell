import { randomBytes } from 'crypto'
import type { AuthUser } from '@/lib/auth'
import { AppError } from '@/lib/errors'
import logger from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { carRepository } from '@/repositories/car.repository'
import { timelineRepository } from '@/repositories/timeline.repository'
import { requireProfileComplete } from '@/lib/profile'
import { userRepository } from '@/repositories/user.repository'
import type { PublishCarInput } from '@/lib/validations/car.schema'
import { ROOT_DOMAIN } from '@/lib/constants'

export interface PublishResult {
  mode: 'FIXED_PRICE' | 'SOUM' | 'AUCTION'
  status: string
  auctionType?: 'PUBLIC' | 'PRIVATE'
  auctionSlug?: string
  auctionUrl?: string
  auctionEndsAt?: string
  sellPrice?: number
}

function shortSlug(): string {
  // URL-safe 6-char slug
  return randomBytes(5).toString('base64url').slice(0, 6)
}

/**
 * Publish a car for sale via one of three modes: Fixed Price, Soum, or Auction.
 * Records a STATUS_CHANGED timeline event. listing is tenant-scoped.
 */
export async function publishCar(user: AuthUser, carId: string, input: PublishCarInput): Promise<PublishResult> {
  const car = await carRepository.findById(carId, user.showroomId)
  if (!car) throw new AppError('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
  if (car.status === 'SOLD') throw new AppError('CAR_SOLD', 'السيارة مباعة', 409)

  const fromStatus = car.status
  let result: PublishResult

  if (input.mode === 'FIXED_PRICE') {
    requireProfileComplete(await steps(user.id), 'car.create')
    await prisma.car.updateMany({
      where: { id: carId, showroomId: user.showroomId, deletedAt: null },
      data: {
        displayMode: 'FIXED_PRICE',
        status: 'FOR_SALE',
        sellPrice: input.sellPrice,
        auctionType: 'NONE',
        notes: input.notes ?? car.notes,
      },
    })
    result = { mode: 'FIXED_PRICE', status: 'FOR_SALE', sellPrice: input.sellPrice }
  } else if (input.mode === 'SOUM') {
    await prisma.car.updateMany({
      where: { id: carId, showroomId: user.showroomId, deletedAt: null },
      data: {
        displayMode: 'SOUM',
        status: 'FOR_SALE',
        sellPrice: input.displayPrice,
        minAcceptedPrice: input.minAcceptedPrice,
        auctionType: 'NONE',
        notes: input.notes ?? car.notes,
      },
    })
    result = { mode: 'SOUM', status: 'FOR_SALE', sellPrice: input.displayPrice }
  } else {
    // AUCTION
    const startAt = new Date(input.startDate)
    const endsAt = new Date(startAt.getTime() + input.durationHours * 3_600_000)
    const isPrivate = input.auctionType === 'PRIVATE'
    const slug = isPrivate ? shortSlug() : null

    await prisma.car.updateMany({
      where: { id: carId, showroomId: user.showroomId, deletedAt: null },
      data: {
        displayMode: 'AUCTION',
        status: 'AUCTION',
        auctionType: input.auctionType,
        auctionSlug: slug,
        auctionStartAt: startAt,
        auctionEndsAt: endsAt,
        auctionOpeningPrice: input.openingPrice,
        auctionBuyNowPrice: input.buyNowPrice ?? null,
        auctionDepositAmount: input.deposit ?? null,
        listedOnMarket: !isPrivate,
      },
    })

    result = {
      mode: 'AUCTION',
      status: 'AUCTION',
      auctionType: input.auctionType,
      auctionEndsAt: endsAt.toISOString(),
      ...(slug ? { auctionSlug: slug, auctionUrl: `${ROOT_DOMAIN}/auction/private/${slug}` } : {}),
    }
  }

  await timelineRepository.append({
    carId,
    userId: user.id,
    eventType: 'STATUS_CHANGED',
    payload: {
      from: fromStatus,
      to: result.status,
      displayMode: result.mode,
      auctionType: result.auctionType ?? null,
    },
  })

  logger.info({ carId, mode: result.mode, showroomId: user.showroomId }, 'car.published')
  return result
}

async function steps(userId: string): Promise<string[]> {
  const u = await userRepository.findById(userId)
  return u?.completedSteps ?? []
}
