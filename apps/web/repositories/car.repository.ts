import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { CreateCarInput, UpdateCarInput, CarFilterInput } from '@/lib/validations/car.schema'
import { PAGINATION } from '@/lib/constants'

export const carRepository = {
  async findByShowroom(showroomId: string, opts?: Partial<CarFilterInput>) {
    const page     = opts?.page ?? 1
    const pageSize = Math.min(opts?.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE)
    const skip     = (page - 1) * pageSize

    const where: Prisma.CarWhereInput = {
      showroomId,
      deletedAt: null,
      ...(opts?.status     ? { status: opts.status }     : {}),
      ...(opts?.brandId    ? { brandId: opts.brandId }    : {}),
      ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts?.year       ? { year: opts.year }          : {}),
      ...(opts?.minPrice != null || opts?.maxPrice != null
        ? {
            sellPrice: {
              ...(opts?.minPrice != null ? { gte: opts.minPrice } : {}),
              ...(opts?.maxPrice != null ? { lte: opts.maxPrice } : {}),
            },
          }
        : {}),
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          brand:    { select: { nameAr: true, nameEn: true } },
          category: { select: { nameAr: true, nameEn: true } },
          model:    { select: { name: true } },
          images:   { where: { isCover: true }, take: 1 },
        },
      }),
      prisma.car.count({ where }),
    ])

    return { cars, total, page, pageSize }
  },

  async findById(carId: string, showroomId: string) {
    return prisma.car.findFirst({
      where: { id: carId, showroomId, deletedAt: null },
      include: {
        brand:     { select: { nameAr: true, nameEn: true } },
        category:  { select: { nameAr: true, nameEn: true } },
        model:     { select: { name: true } },
        images:    { orderBy: { sortOrder: 'asc' } },
        documents: { include: { uploader: { select: { name: true } } } },
        timeline:  { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
        expenses:  true,
        sale:      true,
        bids:      {
          orderBy: { createdAt: 'desc' },
          include: { bidder: { select: { name: true } } },
        },
        carRequests: {
          where:   { type: 'SOUM_OFFER' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, buyerName: true, buyerPhone: true,
            offerAmount: true, status: true, dealerNote: true, createdAt: true,
          },
        },
      },
    })
  },

  async findByRef(carRefNumber: number, showroomId: string) {
    return prisma.car.findFirst({
      where: { carRefNumber, showroomId, deletedAt: null },
    })
  },

  async create(showroomId: string, createdBy: string, data: CreateCarInput & { carRefNumber?: number }) {
    return prisma.car.create({
      data: {
        showroomId,
        createdBy,
        carRefNumber:  data.carRefNumber ?? 0,
        brandId:       data.brandId,
        categoryId:    data.categoryId,
        modelId:       data.modelId,
        year:          data.year,
        carType:       data.carType,
        colorExt:      data.colorExt,
        colorInt:      data.colorInt,
        fuelType:      data.fuelType,
        transmission:  data.transmission,
        odometer:      data.odometer,
        vin:           data.vin,
        bodyType:      data.bodyType,
        status:        data.status,
        purchasePrice: data.purchasePrice,
        sellPrice:     data.sellPrice,
        extraCosts:    data.extraCosts ?? 0,
        plateNumber:   data.plateNumber,
        plateType:     data.plateType,
        notes:         data.notes,
        dataSource:        data.dataSource,
        vdmSequenceNumber: data.vdmSequenceNumber,
        engineSize:        data.engineSize,
      },
    })
  },

  // ── Security fix: always validate showroomId before image/doc ops ──────────
  async addImages(
    carId: string,
    showroomId: string,
    images: { url: string; isCover?: boolean; sortOrder: number }[],
  ) {
    if (images.length === 0) return
    // Verify car belongs to this showroom before writing
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { showroomId: true },
    })
    if (!car || car.showroomId !== showroomId) {
      throw new Error('FORBIDDEN: car does not belong to this showroom')
    }
    await prisma.carImage.createMany({
      data: images.map((img) => ({
        carId,
        url: img.url,
        isCover: img.isCover ?? false,
        sortOrder: img.sortOrder,
      })),
    })
  },

  async addDocument(showroomId: string, data: Prisma.CarDocumentUncheckedCreateInput) {
    // Verify car belongs to this showroom before writing
    const car = await prisma.car.findUnique({
      where: { id: data.carId },
      select: { showroomId: true },
    })
    if (!car || car.showroomId !== showroomId) {
      throw new Error('FORBIDDEN: car does not belong to this showroom')
    }
    return prisma.carDocument.create({ data })
  },

  async update(carId: string, showroomId: string, data: UpdateCarInput) {
    return prisma.car.update({
      where: { id: carId, showroomId, deletedAt: null },
      data,
    })
  },

  async softDelete(carId: string, showroomId: string) {
    return prisma.car.update({
      where: { id: carId, showroomId },
      data:  { deletedAt: new Date() },
    })
  },

  async updateStatus(carId: string, showroomId: string, status: string) {
    return prisma.car.update({
      where: { id: carId, showroomId },
      data:  { status: status as never },
    })
  },

  async countByShowroom(showroomId: string) {
    return prisma.car.count({ where: { showroomId, deletedAt: null } })
  },
}
