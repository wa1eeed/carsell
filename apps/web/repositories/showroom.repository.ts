import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export const showroomRepository = {
  async findById(id: string) {
    return prisma.showroom.findUnique({ where: { id } })
  },

  // ── Public URL settings (slug + custom domain) ──────────────────────────

  async getUrlSettings(showroomId: string) {
    return prisma.showroom.findUnique({
      where:  { id: showroomId },
      select: {
        slug:                 true,
        showroomNumber:       true,
        customDomain:         true,
        customDomainVerified: true,
        customDomainToken:    true,
      },
    })
  },

  async isSlugTaken(slug: string, excludeShowroomId: string): Promise<boolean> {
    const existing = await prisma.showroom.findFirst({
      where:  { slug, NOT: { id: excludeShowroomId } },
      select: { id: true },
    })
    return !!existing
  },

  async updateSlug(showroomId: string, slug: string) {
    return prisma.showroom.update({ where: { id: showroomId }, data: { slug } })
  },

  async isDomainTaken(domain: string, excludeShowroomId: string): Promise<boolean> {
    const existing = await prisma.showroom.findFirst({
      where:  { customDomain: domain, NOT: { id: excludeShowroomId } },
      select: { id: true },
    })
    return !!existing
  },

  /** Set a custom domain (unverified) + generate a DNS verification token */
  async setCustomDomain(showroomId: string, domain: string) {
    const token = `carsell-verify-${randomBytes(8).toString('hex')}`
    return prisma.showroom.update({
      where: { id: showroomId },
      data:  { customDomain: domain.toLowerCase(), customDomainVerified: false, customDomainToken: token },
    })
  },

  async markDomainVerified(showroomId: string) {
    return prisma.showroom.update({ where: { id: showroomId }, data: { customDomainVerified: true } })
  },

  async removeCustomDomain(showroomId: string) {
    return prisma.showroom.update({
      where: { id: showroomId },
      data:  { customDomain: null, customDomainVerified: false, customDomainToken: null },
    })
  },

  async findBySlug(slug: string) {
    return prisma.showroom.findFirst({
      where: { id: slug },
      include: {
        cars: {
          where: { deletedAt: null, status: 'FOR_SALE' },
          include: {
            images:   { where: { isCover: true }, take: 1 },
            brand:    { select: { nameAr: true, nameEn: true } },
            category: { select: { nameAr: true, nameEn: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  },

  async getDashboardStats(showroomId: string) {
    const now       = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [inventoryCount, monthlySales, users] = await Promise.all([
      prisma.car.count({ where: { showroomId, deletedAt: null, status: { not: 'SOLD' } } }),
      prisma.sale.findMany({
        where: { showroomId, soldAt: { gte: monthStart } },
        select: { sellPrice: true, vatAmount: true, netProfit: true },
      }),
      prisma.showroomUser.count({ where: { showroomId, isActive: true } }),
    ])

    const revenue = monthlySales.reduce((sum, s) => sum + Number(s.sellPrice), 0)
    return { inventoryCount, monthlySalesCount: monthlySales.length, revenue, activeUsers: users }
  },
}
