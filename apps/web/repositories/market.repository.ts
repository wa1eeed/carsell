/**
 * Market Repository — CarSell Live public marketplace
 * Lists cars from ALL showrooms that are FOR_SALE or AUCTION.
 * No showroomId scoping — this is intentionally public.
 */

import { prisma } from '@/lib/prisma'

export interface MarketFilters {
  brandId?:    string
  categoryId?: string
  modelId?:    string
  yearMin?:    number
  yearMax?:    number
  priceMin?:   number
  priceMax?:   number
  city?:       string
  carType?:    string   // NEW | USED | USED_QUALIFIED
  fuelType?:   string
  transmission?: string
  search?:     string
  page?:       number
  pageSize?:   number
  sortBy?:     'price_asc' | 'price_desc' | 'year_desc' | 'newest'
}

export async function listMarketCars(filters: MarketFilters = {}) {
  const page     = filters.page     ?? 1
  const pageSize = filters.pageSize ?? 24
  const skip     = (page - 1) * pageSize

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deletedAt:     null,
    status:        { in: ['FOR_SALE', 'AUCTION'] as const },
    mediaDeletedAt: null,
    ...(filters.brandId    ? { brandId:    filters.brandId    } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.modelId    ? { modelId:    filters.modelId    } : {}),
    ...(filters.carType    ? { carType:    filters.carType as never } : {}),
    ...(filters.fuelType   ? { fuelType:   filters.fuelType as never } : {}),
    ...(filters.transmission ? { transmission: filters.transmission as never } : {}),
    ...(filters.yearMin || filters.yearMax ? {
      year: {
        ...(filters.yearMin ? { gte: filters.yearMin } : {}),
        ...(filters.yearMax ? { lte: filters.yearMax } : {}),
      },
    } : {}),
    ...(filters.priceMin || filters.priceMax ? {
      sellPrice: {
        ...(filters.priceMin ? { gte: filters.priceMin } : {}),
        ...(filters.priceMax ? { lte: filters.priceMax } : {}),
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
      case 'price_asc':  return { sellPrice: 'asc'  as const }
      case 'price_desc': return { sellPrice: 'desc' as const }
      case 'year_desc':  return { year:      'desc' as const }
      default:           return { createdAt: 'desc' as const }
    }
  })()

  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        brand:    { select: { nameAr: true, nameEn: true, logoUrl: true } },
        category: { select: { nameAr: true, nameEn: true, bodyType: true } },
        model:    { select: { name: true } },
        images:   { where: { isCover: true }, take: 1, select: { url: true } },
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
          },
        },
      },
    }),
    prisma.car.count({ where }),
  ])

  return { cars, total, page, pageSize }
}

export async function getMarketCar(carId: string) {
  return prisma.car.findFirst({
    where: {
      id:        carId,
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

export async function getMarketFiltersData() {
  const [brands, cities] = await Promise.all([
    prisma.brand.findMany({
      where:   { isActive: true },
      orderBy: { nameAr: 'asc' },
      include: {
        categories: {
          where:   { isActive: true },
          include: { models: { where: { isActive: true } } },
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
  return { brands, cities: cities.map((s) => s.city).filter(Boolean) as string[] }
}
