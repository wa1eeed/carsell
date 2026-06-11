import { requirePageUser } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { BarChart3, TrendingUp, Package, Clock } from 'lucide-react'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'التقارير — CarLink' }

export default async function ReportsPage() {
  const user = await requirePageUser()
  const showroomId = user.showroomId

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart  = new Date(now.getFullYear(), 0, 1)

  const [
    monthSales, yearSales, inventory, topModels, agingCars,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { showroomId, soldAt: { gte: monthStart } }, _sum: { sellPrice: true, netProfit: true, vatAmount: true }, _count: true }),
    prisma.sale.aggregate({ where: { showroomId, soldAt: { gte: yearStart  } }, _sum: { sellPrice: true, netProfit: true }, _count: true }),
    prisma.car.groupBy({ by: ['status'], where: { showroomId, deletedAt: null }, _count: true }),
    // Top selling brands
    prisma.sale.findMany({
      where:   { showroomId },
      select:  { car: { select: { brand: { select: { nameAr: true } } } } },
      take:    200,
    }),
    // Cars sitting > 60 days
    prisma.car.count({
      where: { showroomId, deletedAt: null, status: { in: ['FOR_SALE', 'AUCTION'] }, createdAt: { lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) } },
    }),
  ])

  // aggregate top brands
  const brandCounts = new Map<string, number>()
  for (const s of topModels) {
    const b = s.car.brand.nameAr
    brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1)
  }
  const topBrands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxBrand  = topBrands[0]?.[1] ?? 1

  const inventoryByStatus = Object.fromEntries(inventory.map((i) => [i.status, i._count]))

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">التقارير والتحليلات</h1>
        <p className="text-gray-500 text-sm mt-1">أداء معرضك في لمحة</p>
      </div>

      {/* This month */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">هذا الشهر</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="المبيعات" value={String(monthSales._count)} icon={BarChart3} />
          <Metric label="الإيرادات" value={Number(monthSales._sum.sellPrice ?? 0).toLocaleString('ar-SA')} suffix="ريال" gold icon={TrendingUp} />
          <Metric label="صافي الربح" value={Number(monthSales._sum.netProfit ?? 0).toLocaleString('ar-SA')} suffix="ريال" gold icon={TrendingUp} />
          <Metric label="الضريبة المحصّلة" value={Number(monthSales._sum.vatAmount ?? 0).toLocaleString('ar-SA')} suffix="ريال" icon={BarChart3} />
        </div>
      </div>

      {/* This year + inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top brands */}
        <div className="bg-white rounded-[12px] border border-gray-100 p-5">
          <h2 className="font-bold text-[#0F3460] mb-4">أكثر الماركات مبيعاً</h2>
          {topBrands.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">لا توجد مبيعات بعد</p>
          ) : (
            <div className="space-y-3">
              {topBrands.map(([brand, count]) => (
                <div key={brand}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{brand}</span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0F3460] rounded-full" style={{ width: `${(count / maxBrand) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory breakdown */}
        <div className="bg-white rounded-[12px] border border-gray-100 p-5">
          <h2 className="font-bold text-[#0F3460] mb-4">حالة المخزون</h2>
          <div className="grid grid-cols-2 gap-3">
            <InventoryStat label="معروضة للبيع" value={inventoryByStatus.FOR_SALE ?? 0} color="text-green-600 bg-green-50" />
            <InventoryStat label="في مزاد"      value={inventoryByStatus.AUCTION ?? 0}  color="text-purple-600 bg-purple-50" />
            <InventoryStat label="مسودة"        value={inventoryByStatus.DRAFT ?? 0}    color="text-gray-600 bg-gray-100" />
            <InventoryStat label="مباعة"        value={inventoryByStatus.SOLD ?? 0}     color="text-blue-600 bg-blue-50" />
          </div>

          {/* Aging alert */}
          {agingCars > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-700 rounded-[8px] px-3 py-2.5 text-sm">
              <Clock size={15} />
              {agingCars} سيارة معروضة منذ أكثر من 60 يوم
            </div>
          )}
        </div>
      </div>

      {/* Year summary */}
      <div className="bg-[#0F3460] rounded-[12px] p-6 text-white">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Package size={18} /> ملخص السنة</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold">{yearSales._count}</div>
            <div className="text-white/60 text-sm mt-1">سيارة مباعة</div>
          </div>
          <div>
            <div className="price-number text-3xl font-bold text-[#C9A84C] font-mono ltr">{Number(yearSales._sum.sellPrice ?? 0).toLocaleString('ar-SA')}</div>
            <div className="text-white/60 text-sm mt-1">إجمالي المبيعات (ريال)</div>
          </div>
          <div>
            <div className="price-number text-3xl font-bold text-green-400 font-mono ltr">{Number(yearSales._sum.netProfit ?? 0).toLocaleString('ar-SA')}</div>
            <div className="text-white/60 text-sm mt-1">صافي الربح (ريال)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, suffix, gold, icon: Icon }: {
  label: string; value: string; suffix?: string; gold?: boolean; icon: typeof BarChart3
}) {
  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-5">
      <div className="w-9 h-9 rounded-[8px] bg-[#0F3460]/5 flex items-center justify-center mb-3">
        <Icon size={18} className="text-[#0F3460]" />
      </div>
      <div className={`text-xl font-bold ${gold ? 'text-[#C9A84C] font-mono ltr' : 'text-gray-900'}`}>
        {value} {suffix && <span className="text-xs text-gray-400 font-sans">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function InventoryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 rounded-[8px] bg-gray-50">
      <div className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
