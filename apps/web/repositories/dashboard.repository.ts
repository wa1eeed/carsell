import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/auth'

export interface KpiTrend { value: number }

export interface DashboardKpis {
  inventoryCount: number
  monthlySales: number
  monthlyRevenue: number
  activeUsers: number
  showroomCount: number
  trends: {
    monthlySales: KpiTrend
    monthlyRevenue: KpiTrend
  }
}

export interface MarketStats {
  listedCount: number
  marketValue: number
  brandBreakdown: { brand: string; count: number }[]
}

export interface RecentCar {
  id: string
  title: string
  vin: string | null
  showroomName: string
  price: number | null
  status: 'DRAFT' | 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD'
  source: string
  createdAt: Date
}

function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfLastMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1)
}

function pctChange(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prev) / prev) * 100)
}

const isPlatformAdmin = (user: AuthUser) => user.role === 'PLATFORM_ADMIN'

/**
 * Tenant scope: platform admins see everything; everyone else is scoped to their showroom.
 */
function carScope(user: AuthUser) {
  return isPlatformAdmin(user) ? { deletedAt: null } : { showroomId: user.showroomId, deletedAt: null }
}

export const dashboardRepository = {
  async getKpis(user: AuthUser): Promise<DashboardKpis> {
    const monthStart     = startOfMonth()
    const lastMonthStart = startOfLastMonth()
    const saleScope = isPlatformAdmin(user) ? {} : { showroomId: user.showroomId }

    const [inventoryCount, monthlySales, revenueAgg, prevSales, prevRevenueAgg, activeUsers, showroomCount] = await Promise.all([
      prisma.car.count({ where: carScope(user) }),
      prisma.sale.count({ where: { ...saleScope, soldAt: { gte: monthStart } } }),
      prisma.sale.aggregate({ where: { ...saleScope, soldAt: { gte: monthStart } }, _sum: { sellPrice: true } }),
      prisma.sale.count({ where: { ...saleScope, soldAt: { gte: lastMonthStart, lt: monthStart } } }),
      prisma.sale.aggregate({ where: { ...saleScope, soldAt: { gte: lastMonthStart, lt: monthStart } }, _sum: { sellPrice: true } }),
      prisma.showroomUser.count({
        where: isPlatformAdmin(user) ? { isActive: true } : { showroomId: user.showroomId, isActive: true },
      }),
      isPlatformAdmin(user) ? prisma.showroom.count() : Promise.resolve(1),
    ])

    const monthlyRevenue = Number(revenueAgg._sum.sellPrice ?? 0)
    const prevRevenue    = Number(prevRevenueAgg._sum.sellPrice ?? 0)

    return {
      inventoryCount,
      monthlySales,
      monthlyRevenue,
      activeUsers,
      showroomCount,
      trends: {
        monthlySales:   { value: pctChange(monthlySales, prevSales) },
        monthlyRevenue: { value: pctChange(monthlyRevenue, prevRevenue) },
      },
    }
  },

  async getMarketStats(user: AuthUser): Promise<MarketStats> {
    const scope = isPlatformAdmin(user)
      ? { deletedAt: null, listedOnMarket: true }
      : { showroomId: user.showroomId, deletedAt: null, listedOnMarket: true }

    const [listedCount, valueAgg, grouped] = await Promise.all([
      prisma.car.count({ where: scope }),
      prisma.car.aggregate({ where: scope, _sum: { marketPrice: true } }),
      prisma.car.groupBy({ by: ['brandId'], where: scope, _count: { _all: true } }),
    ])

    const brands = await prisma.brand.findMany({
      where: { id: { in: grouped.map((g) => g.brandId) } },
      select: { id: true, nameAr: true, nameEn: true },
    })
    const brandName = new Map(brands.map((b) => [b.id, b.nameAr]))

    return {
      listedCount,
      marketValue: Number(valueAgg._sum.marketPrice ?? 0),
      brandBreakdown: grouped
        .map((g) => ({ brand: brandName.get(g.brandId) ?? '—', count: g._count._all }))
        .sort((a, b) => b.count - a.count),
    }
  },

  async getRecentCars(user: AuthUser, limit = 8): Promise<RecentCar[]> {
    const cars = await prisma.car.findMany({
      where: carScope(user),
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        brand: true,
        category: true,
        showroom: { select: { name: true } },
      },
    })

    return cars.map((c) => ({
      id: c.id,
      title: `${c.brand.nameAr} ${c.category.nameAr} ${c.year}`,
      vin: c.vin,
      showroomName: c.showroom.name,
      price: c.sellPrice ? Number(c.sellPrice) : null,
      status: c.status,
      source: c.dataSource,
      createdAt: c.createdAt,
    }))
  },

  async getActiveAuctions(user: AuthUser, limit = 5) {
    const scope = isPlatformAdmin(user)
      ? { deletedAt: null, status: 'AUCTION' as const }
      : { showroomId: user.showroomId, deletedAt: null, status: 'AUCTION' as const }

    const cars = await prisma.car.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        brand: true,
        category: true,
        bids: { orderBy: { amount: 'desc' }, take: 1 },
      },
    })

    return cars.map((c) => ({
      id: c.id,
      title: `${c.brand.nameAr} ${c.category.nameAr} ${c.year}`,
      topBid: c.bids[0] ? Number(c.bids[0].amount) : Number(c.sellPrice ?? 0),
      status: 'active' as const,
    }))
  },

  async getRecentActivity(user: AuthUser, limit = 10) {
    const events = await prisma.carTimeline.findMany({
      where: isPlatformAdmin(user) ? {} : { car: { showroomId: user.showroomId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    })

    return events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      userName: e.user.name,
      createdAt: e.createdAt,
    }))
  },

  async getAlerts(user: AuthUser) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [kycPending, auctionEnding, pendingRequests, activeDeals] = await Promise.all([
      prisma.showroomUser.count({
        where: isPlatformAdmin(user)
          ? { kycStatus: 'PENDING' }
          : { showroomId: user.showroomId, kycStatus: 'PENDING' },
      }),
      prisma.car.count({
        where: isPlatformAdmin(user)
          ? { status: 'AUCTION', deletedAt: null }
          : { showroomId: user.showroomId, status: 'AUCTION', deletedAt: null },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.carRequest as any).count({
        where: isPlatformAdmin(user)
          ? { status: 'PENDING', createdAt: { lte: dayAgo } }
          : { showroomId: user.showroomId, status: 'PENDING', createdAt: { lte: dayAgo } },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.carRequest as any).count({
        where: isPlatformAdmin(user)
          ? { status: { in: ['RESERVED', 'WAITING_PAYMENT', 'OWNERSHIP_TRANSFER'] } }
          : { showroomId: user.showroomId, status: { in: ['RESERVED', 'WAITING_PAYMENT', 'OWNERSHIP_TRANSFER'] } },
      }),
    ])
    const [expiringSubscriptions, carsWithoutImages] = await Promise.all([
      isPlatformAdmin(user)
        ? prisma.subscription.count({ where: { status: { in: ['EXPIRED', 'SUSPENDED'] } } })
        : Promise.resolve(0),
      prisma.car.count({
        where: isPlatformAdmin(user)
          ? { deletedAt: null, status: { in: ['FOR_SALE', 'DRAFT'] }, images: { none: {} } }
          : { showroomId: user.showroomId, deletedAt: null, status: { in: ['FOR_SALE', 'DRAFT'] }, images: { none: {} } },
      }),
    ])

    return { kycPending, expiringSubscriptions, auctionEnding, dayAgo, pendingRequests, activeDeals, carsWithoutImages }
  },
}
