/**
 * Market Repository — CarSell Live public marketplace
 * Lists cars from ALL showrooms that are FOR_SALE or AUCTION.
 * No showroomId scoping — this is intentionally public.
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface MarketFilters {
  brandId?:      string
  categoryId?:   string
  modelId?:      string
  yearMin?:      number
  yearMax?:      number
  priceMin?:     number
  priceMax?:     number
  city?:         string
  carType?:      string   // NEW | USED | USED_QUALIFIED
  fuelType?:     string
  transmission?: string
  bodyType?:     string   // SUV | SEDAN | PICKUP | COUPE | HATCHBACK | VAN | CONVERTIBLE | WAGON
  displayMode?:  'AUCTION' // filter to show only auction cars
  search?:       string
  page?:         number
  pageSize?:     number
  sortBy?:       'price_asc' | 'price_desc' | 'year_desc' | 'newest' | 'odometer_asc'
}

export async function listMarketCars(filters: MarketFilters = {}) {
  const page     = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(48, filters.pageSize ?? 24)  // cap at 48 per page
  const skip     = (page - 1) * pageSize

  // Prisma where clause — typed via the generated Prisma namespace (no `any`)
  const where: Prisma.CarWhereInput = {
    deletedAt: null,
    status:    filters.displayMode === 'AUCTION'
      ? 'AUCTION'
      : { in: ['FOR_SALE', 'AUCTION'] },
    ...(filters.brandId    ? { brandId:    filters.brandId    } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.modelId    ? { modelId:    filters.modelId    } : {}),
    ...(filters.carType    ? { carType:    filters.carType    as never } : {}),
    ...(filters.fuelType   ? { fuelType:   filters.fuelType   as never } : {}),
    ...(filters.transmission ? { transmission: filters.transmission as never } : {}),
    ...(filters.bodyType   ? {
      // bodyType lives on the Category, not Car — filter via category relation
      category: { bodyType: filters.bodyType as never },
    } : {}),
    ...(filters.yearMin || filters.yearMax ? {
      year: {
        ...(filters.yearMin ? { gte: filters.yearMin } : {}),
        ...(filters.yearMax ? { lte: filters.yearMax } : {}),
      },
    } : {}),
    ...(filters.priceMin !== undefined || filters.priceMax !== undefined ? {
      sellPrice: {
        ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
        ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
      },
    } : {}),
    ...(filters.city ? {
      showroom: { city: { contains: filters.city, mode: 'insensitive' as const } },
    } : {}),
    ...(filters.search ? {
      OR: [
        { brand:    { nameAr: { contains: filters.search, mode: 'insensitive' as const } } },
        { brand:    { nameEn: { contains: filters.search, mode: 'insensitive' as const } } },
        { category: { nameAr: { contains: filters.search, mode: 'insensitive' as const } } },
        { model:    { name:   { contains: filters.search, mode: 'insensitive' as const } } },
      ],
    } : {}),
  }

  const orderBy = (() => {
    switch (filters.sortBy) {
      case 'price_asc':    return { sellPrice: 'asc'  as const }
      case 'price_desc':   return { sellPrice: 'desc' as const }
      case 'year_desc':    return { year:      'desc' as const }
      case 'odometer_asc': return { odometer:  'asc'  as const }
      default:             return { createdAt: 'desc' as const }
    }
  })()

  const [cars, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.car as any).findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id:            true,
        carRefNumber:  true,
        carPublicId:   true,
        year:          true,
        carType:       true,
        odometer:      true,
        fuelType:      true,
        transmission:  true,
        sellPrice:     true,
        status:        true,
        displayMode:   true,
        brand:    { select: { nameAr: true, nameEn: true, logoUrl: true } },
        category: { select: { nameAr: true, nameEn: true, bodyType: true } },
        model:    { select: { name: true } },
        images:   { where: { isCover: true }, take: 1, select: { url: true } },
        showroom: {
          select: {
            id:      true,
            name:    true,
            slug:    true,
            city:    true,
            logoUrl: true,
            whatsapp: true,
          },
        },
      },
    }),
    prisma.car.count({ where }),
  ])

  return { cars, total, page, pageSize }
}

export async function getMarketCar(carId: string) {
  const isPublicId = /^CS\d{8}$/.test(carId)
  const isRef      = !isPublicId && /^\d+$/.test(carId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma.car as any).findFirst({
    where: {
      ...(isPublicId ? { carPublicId: carId }
        : isRef      ? { carRefNumber: Number(carId) }
        :               { id: carId }),
      deletedAt: null,
      status:    { in: ['FOR_SALE', 'AUCTION'] },
    },
    include: {
      brand:    true,
      category: true,
      model:    true,
      images:   { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
      showroom: {
        select: {
          id:             true,
          name:           true,
          slug:           true,
          city:           true,
          logoUrl:        true,
          showroomNumber: true,
          whatsapp:       true,
          phone:          true,
          instagramUrl:   true,
        },
      },
    },
  })
}

const CAR_SELECT = {
  id: true, carRefNumber: true, carPublicId: true, year: true, carType: true,
  odometer: true, fuelType: true, transmission: true, sellPrice: true,
  status: true, displayMode: true, auctionEndsAt: true,
  brand:    { select: { nameAr: true, nameEn: true } },
  category: { select: { nameAr: true, nameEn: true } },
  model:    { select: { name: true } },
  images:   { where: { isCover: true }, take: 1, select: { url: true } },
  showroom: { select: { name: true, city: true, slug: true } },
} as const

export async function getMarketHomepageData() {
  const baseWhere: Prisma.CarWhereInput = { deletedAt: null, status: { in: ['FOR_SALE', 'AUCTION'] }, listedOnMarket: true }

  const [newCars, usedCars, auctionCars, brands] = await Promise.all([
    prisma.car.findMany({
      where: { ...baseWhere, carType: 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: CAR_SELECT,
    }),
    prisma.car.findMany({
      where: { ...baseWhere, carType: { in: ['USED', 'USED_QUALIFIED'] } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: CAR_SELECT,
    }),
    prisma.car.findMany({
      where: { ...baseWhere, status: 'AUCTION' },
      orderBy: { auctionEndsAt: 'asc' },
      take: 6,
      select: CAR_SELECT,
    }),
    prisma.brand.findMany({
      where:   { isActive: true },
      orderBy: { nameAr: 'asc' },
      select:  { id: true, nameAr: true, nameEn: true, logoUrl: true },
    }),
  ])

  return { newCars, usedCars, auctionCars, brands }
}

export async function getMarketFiltersData() {
  const [brands, cities] = await Promise.all([
    prisma.brand.findMany({
      where:   { isActive: true },
      orderBy: { nameAr: 'asc' },
      select: {
        id:     true,
        nameAr: true,
        nameEn: true,
        categories: {
          where:  { isActive: true },
          select: {
            id:     true,
            nameAr: true,
            models: {
              where:  { isActive: true },
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { nameAr: 'asc' },
        },
      },
    }),
    prisma.showroom.findMany({
      where:    { city: { not: null } },
      select:   { city: true },
      distinct: ['city'],
      orderBy:  { city: 'asc' },
    }),
  ])
  return {
    brands,
    cities: cities.map((s) => s.city).filter(Boolean) as string[],
  }
}
