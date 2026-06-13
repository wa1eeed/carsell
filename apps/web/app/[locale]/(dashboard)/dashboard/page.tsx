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
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-cl-primary">{t('title')}</h1>

      {/* 1. KPI cards — 4 cards relevant to the showroom user */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label={t('inventory')}        value={data.kpis.inventoryCount}  icon="car"      />
        <KpiCard label={t('monthlySales')}     value={data.kpis.monthlySales}    icon="sales"    trend={data.kpis.trends.monthlySales} />
        <KpiCard label={t('revenue')}          value={data.kpis.monthlyRevenue}  icon="revenue"  isPrice trend={data.kpis.trends.monthlyRevenue} />
        <KpiCard label={t('pendingRequests')}  value={data.kpis.pendingRequests} icon="requests" />
      </div>

      {/* 2. آخر السيارات المضافة — أهم بلوك بعد الأرقام */}
      <RecentCarsTable cars={data.recentCars} />

      {/* 3. المزادات النشطة */}
      <ActiveAuctionsTable auctions={data.auctions} />

      {/* 4. إحصائيات الماركت + سجل النشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MarketSection market={data.market} />
        </div>
        <ActivityFeed activity={data.activity} />
      </div>

      {/* 5. روابط المعرض + التنبيهات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PublicLinksPanel
            showroomSlug={showroom?.slug ?? null}
            showroomName={showroom?.name ?? ''}
            locale={params.locale}
          />
        </div>
        <AlertsSection alerts={data.alerts} />
      </div>
    </div>
  )
}
