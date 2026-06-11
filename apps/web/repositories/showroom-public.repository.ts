import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface ShowroomFilters {
  brandId?: string
  categoryId?: string
  year?: number
  minPrice?: number
  maxPrice?: number
  condition?: 'NEW' | 'USED' | 'USED_QUALIFIED'
}

/**
 * Public showroom storefront — read-only, NOT auth-scoped (public visitors).
 * Only exposes non-deleted cars that are FOR_SALE or AUCTION.
 */
const SHOWROOM_SELECT = {
  id: true,
  slug: true,
  name: true,
  city: true,
  logoUrl: true,
  coverImageUrl: true,
  tagline: true,
  whatsapp: true,
  phone: true,
  instagramUrl: true,
  showPrices: true,
  customDomain: true,
  customDomainVerified: true,
} as const

export const showroomPublicRepository = {
  async findShowroom(slugOrId: string) {
    return prisma.showroom.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      select: SHOWROOM_SELECT,
    })
  },

  /** Resolve a showroom by its verified custom domain (e.g. mydealership.com) */
  async findShowroomByDomain(domain: string) {
    return prisma.showroom.findFirst({
      where: { customDomain: domain.toLowerCase(), customDomainVerified: true },
      select: SHOWROOM_SELECT,
    })
  },

  async listCars(showroomId: string, filters: ShowroomFilters) {
    const where: Prisma.CarWhereInput = {
      showroomId,
      deletedAt: null,
      status: { in: ['FOR_SALE', 'AUCTION'] },
      ...(filters.brandId ? { brandId: filters.brandId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.year ? { year: filters.year } : {}),
      ...(filters.condition ? { carType: filters.condition } : {}),
      ...(filters.minPrice != null || filters.maxPrice != null
        ? {
            sellPrice: {
              ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
    }

    return prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { nameAr: true, nameEn: true } },
        category: { select: { nameAr: true, nameEn: true } },
        images: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    })
  },

  async findCar(showroomId: string, carId: string) {
    return prisma.car.findFirst({
      where: { id: carId, showroomId, deletedAt: null, status: { in: ['FOR_SALE', 'AUCTION', 'RESERVED'] } },
      include: {
        brand: true,
        category: true,
        model: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  },

  async listBrandsForShowroom(showroomId: string) {
    const grouped = await prisma.car.groupBy({
      by: ['brandId'],
      where: { showroomId, deletedAt: null, status: { in: ['FOR_SALE', 'AUCTION'] } },
    })
    if (grouped.length === 0) return []
    return prisma.brand.findMany({
      where: { id: { in: grouped.map((g) => g.brandId) } },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { nameAr: 'asc' },
    })
  },
}
