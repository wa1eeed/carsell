import { prisma } from '@/lib/prisma'
import { PAGINATION } from '@/lib/constants'

export const saleRepository = {
  async findByShowroom(showroomId: string, page = 1, pageSize = PAGINATION.DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * pageSize
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { showroomId },
        skip,
        take: pageSize,
        orderBy: { soldAt: 'desc' },
        include: {
          car:      { select: { id: true, brandId: true, year: true, vin: true } },
          customer: { select: { name: true, phone: true } },
          creator:  { select: { name: true } },
        },
      }),
      prisma.sale.count({ where: { showroomId } }),
    ])
    return { sales, total, page, pageSize }
  },

  async create(data: {
    carId:         string
    showroomId:    string
    customerId:    string
    sellPrice:     number
    purchasePrice: number
    extraCosts:    number
    vatAmount:     number
    netProfit:     number
    vatMethodUsed: string
    paymentMethod: string
    notes?:        string
    createdBy:     string
  }) {
    return prisma.sale.create({
      data: {
        carId:         data.carId,
        showroomId:    data.showroomId,
        customerId:    data.customerId,
        sellPrice:     data.sellPrice,
        purchasePrice: data.purchasePrice,
        extraCosts:    data.extraCosts,
        vatAmount:     data.vatAmount,
        netProfit:     data.netProfit,
        vatMethodUsed: data.vatMethodUsed as never,
        paymentMethod: data.paymentMethod as never,
        notes:         data.notes,
        createdBy:     data.createdBy,
      },
    })
  },
}
