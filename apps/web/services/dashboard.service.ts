import type { AuthUser } from '@/lib/auth'
import { dashboardRepository } from '@/repositories/dashboard.repository'
import logger from '@/lib/logger'

export async function getDashboardData(user: AuthUser) {
  try {
    const [kpis, market, recentCars, auctions, activity, alerts] = await Promise.all([
      dashboardRepository.getKpis(user),
      dashboardRepository.getMarketStats(user),
      dashboardRepository.getRecentCars(user),
      dashboardRepository.getActiveAuctions(user),
      dashboardRepository.getRecentActivity(user),
      dashboardRepository.getAlerts(user),
    ])
    return { kpis, market, recentCars, auctions, activity, alerts, ok: true as const }
  } catch (err) {
    logger.error({ err }, 'dashboard.load.failed')
    return {
      ok: false as const,
      kpis: { inventoryCount: 0, monthlySales: 0, monthlyRevenue: 0, pendingRequests: 0, activeUsers: 0, showroomCount: 0, trends: { monthlySales: { value: 0 }, monthlyRevenue: { value: 0 } } },
      market: { listedCount: 0, marketValue: 0, brandBreakdown: [] },
      recentCars: [],
      auctions: [],
      activity: [],
      alerts: { kycPending: 0, expiringSubscriptions: 0, auctionEnding: 0, dayAgo: new Date(), pendingRequests: 0, activeDeals: 0, carsWithoutImages: 0 },
    }
  }
}
