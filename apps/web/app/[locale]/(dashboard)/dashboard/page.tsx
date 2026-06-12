import { getTranslations } from 'next-intl/server'
import { requirePageUser } from '@/lib/auth-guard'
import { getDashboardData } from '@/services/dashboard.service'
import { KpiCard } from '@/components/features/dashboard/KpiCard'
import { MarketSection } from '@/components/features/dashboard/MarketSection'
import { ActiveAuctionsTable } from '@/components/features/dashboard/ActiveAuctionsTable'
import { RecentCarsTable } from '@/components/features/dashboard/RecentCarsTable'
import { AlertsSection } from '@/components/features/dashboard/AlertsSection'
import { ActivityFeed } from '@/components/features/dashboard/ActivityFeed'
import { PublicLinksPanel } from '@/components/features/dashboard/PublicLinksPanel'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('dashboard')
  const user = await requirePageUser()
  const [data, showroom] = await Promise.all([
    getDashboardData(user),
    prisma.showroom.findUnique({
      where:  { id: user.showroomId },
      select: { slug: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cl-primary">{t('title')}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label={t('inventory')} value={data.kpis.inventoryCount} icon="car" />
        <KpiCard label={t('monthlySales')} value={data.kpis.monthlySales} icon="sales" />
        <KpiCard label={t('revenue')} value={data.kpis.monthlyRevenue} icon="revenue" isPrice />
        <KpiCard label={t('activeUsers')} value={data.kpis.activeUsers} icon="users" />
        <KpiCard label={t('showrooms')} value={data.kpis.showroomCount} icon="showrooms" />
      </div>

      {/* Public Links + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketSection market={data.market} />
        </div>
        <div className="space-y-4">
          <PublicLinksPanel
            showroomSlug={showroom?.slug ?? null}
            showroomName={showroom?.name ?? ''}
            locale={params.locale}
          />
          <AlertsSection alerts={data.alerts} />
        </div>
      </div>

      {/* Auctions */}
      <ActiveAuctionsTable auctions={data.auctions} />

      {/* Recent cars + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentCarsTable cars={data.recentCars} />
        </div>
        <ActivityFeed activity={data.activity} />
      </div>
    </div>
  )
}
