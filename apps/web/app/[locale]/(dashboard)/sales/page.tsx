import { requirePageUser } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { Receipt, TrendingUp, Wallet } from 'lucide-react'
import Link from 'next/link'
import { formatCarRef } from '@/lib/format'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'المبيعات — CarSell' }

const PAYMENT_AR: Record<string, string> = {
  CASH: 'نقدي', BANK_TRANSFER: 'تحويل', FINANCING: 'تمويل', TRADE_IN: 'استبدال', MIXED: 'مختلط',
}

export default async function SalesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requirePageUser()
  const page = Number(searchParams.page ?? 1)
  const take = 20

  const [sales, total, stats] = await Promise.all([
    prisma.sale.findMany({
      where:   { showroomId: user.showroomId },
      orderBy: { soldAt: 'desc' },
      skip:    (page - 1) * take,
      take,
      include: {
        car:      { select: { carRefNumber: true, year: true, brand: { select: { nameAr: true } }, category: { select: { nameAr: true } } } },
        customer: { select: { name: true, phone: true } },
      },
    }),
    prisma.sale.count({ where: { showroomId: user.showroomId } }),
    prisma.sale.aggregate({
      where: { showroomId: user.showroomId },
      _sum:  { sellPrice: true, netProfit: true },
    }),
  ])

  const totalSales  = Number(stats._sum.sellPrice ?? 0)
  const totalProfit = Number(stats._sum.netProfit ?? 0)

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">المبيعات</h1>
        <p className="text-gray-500 text-sm mt-1">سجل كل عمليات البيع</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Receipt}    label="عدد المبيعات"     value={String(total)} />
        <StatCard icon={Wallet}     label="إجمالي المبيعات"  value={totalSales.toLocaleString('ar-SA')}  suffix="ريال" gold />
        <StatCard icon={TrendingUp} label="صافي الربح"       value={totalProfit.toLocaleString('ar-SA')} suffix="ريال" gold />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-100">
            <tr>
              <th className="text-right p-4 font-medium text-gray-500">السيارة</th>
              <th className="text-right p-4 font-medium text-gray-500">المشتري</th>
              <th className="text-right p-4 font-medium text-gray-500">السعر</th>
              <th className="text-right p-4 font-medium text-gray-500">الضريبة</th>
              <th className="text-right p-4 font-medium text-gray-500">الربح</th>
              <th className="text-right p-4 font-medium text-gray-500">الدفع</th>
              <th className="text-right p-4 font-medium text-gray-500">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-[#0F3460]">{s.car.brand.nameAr} {s.car.category.nameAr} {s.car.year}</div>
                  <div className="text-xs text-gray-400 font-mono">{formatCarRef(s.car.carRefNumber)}</div>
                </td>
                <td className="p-4">
                  <div className="text-gray-800">{s.customer.name}</div>
                  {s.customer.phone && <div className="text-xs text-gray-400 font-mono ltr">{s.customer.phone}</div>}
                </td>
                <td className="p-4"><span className="price-number font-mono ltr text-[#C9A84C] font-semibold">{Number(s.sellPrice).toLocaleString('ar-SA')}</span></td>
                <td className="p-4 text-gray-500 font-mono ltr">{Number(s.vatAmount).toLocaleString('ar-SA')}</td>
                <td className="p-4"><span className="font-mono ltr text-green-600">{Number(s.netProfit).toLocaleString('ar-SA')}</span></td>
                <td className="p-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{PAYMENT_AR[s.paymentMethod] ?? s.paymentMethod}</span></td>
                <td className="p-4 text-gray-400 text-xs">{s.soldAt.toLocaleDateString('ar-SA')}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">
                <Receipt size={32} className="mx-auto mb-2 text-gray-300" />
                لا توجد مبيعات بعد — سجّل أول بيع من صفحة السيارة
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > take && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={`?page=${page - 1}`} className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm bg-white">السابق</Link>}
          <span className="px-4 py-2 text-sm text-gray-500">صفحة {page} من {Math.ceil(total / take)}</span>
          {page < Math.ceil(total / take) && <Link href={`?page=${page + 1}`} className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm bg-white">التالي</Link>}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, gold }: {
  icon: typeof Receipt; label: string; value: string; suffix?: string; gold?: boolean
}) {
  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-5">
      <div className="w-9 h-9 rounded-[8px] bg-[#0F3460]/5 flex items-center justify-center mb-3">
        <Icon size={18} className="text-[#0F3460]" />
      </div>
      <div className={`text-2xl font-bold ${gold ? 'text-[#C9A84C] font-mono ltr' : 'text-gray-900'}`}>
        {value} {suffix && <span className="text-sm text-gray-400 font-sans">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
