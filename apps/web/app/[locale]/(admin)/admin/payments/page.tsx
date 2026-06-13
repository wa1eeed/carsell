import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { CreditCard, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import { formatShowroomId } from '@/lib/format'

export const dynamic  = 'force-dynamic'

export default async function AdminPaymentsPage() {
  const t = await getTranslations('adminPayments')

  const [payments, stats] = await Promise.all([
    prisma.tapPayment.findMany({
      orderBy: { createdAt: 'desc' },
      take:    100,
      include: {
        subscription: {
          select: {
            plan:     { select: { nameAr: true } },
            showroom: { select: { name: true, showroomNumber: true } },
          },
        },
      },
    }),
    (async () => {
      const captured = await prisma.tapPayment.aggregate({
        where: { status: 'CAPTURED' },
        _sum:  { amount: true },
        _count: true,
      })
      const failed = await prisma.tapPayment.count({ where: { status: 'FAILED' } })
      return { totalRevenue: Number(captured._sum.amount ?? 0), successCount: captured._count, failedCount: failed }
    })(),
  ])

  const STATUS_STYLE: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
    CAPTURED:  { cls: 'bg-green-50 text-green-600',  icon: CheckCircle2 },
    INITIATED: { cls: 'bg-amber-50 text-amber-600',  icon: Clock },
    FAILED:    { cls: 'bg-red-50 text-red-500',      icon: XCircle },
    REFUNDED:  { cls: 'bg-gray-100 text-gray-500',   icon: XCircle },
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] border border-gray-100 p-5">
          <div className="w-9 h-9 rounded-[8px] bg-green-50 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <div className="price-number text-2xl font-bold text-[#C9A84C] font-mono ltr">
            {stats.totalRevenue.toLocaleString('ar-SA')}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">{t('totalRevenue')}</div>
        </div>
        <div className="bg-white rounded-[12px] border border-gray-100 p-5">
          <div className="w-9 h-9 rounded-[8px] bg-blue-50 flex items-center justify-center mb-3">
            <CheckCircle2 size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.successCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">{t('successCount')}</div>
        </div>
        <div className="bg-white rounded-[12px] border border-gray-100 p-5">
          <div className="w-9 h-9 rounded-[8px] bg-red-50 flex items-center justify-center mb-3">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.failedCount}</div>
          <div className="text-sm text-gray-500 mt-0.5">{t('failCount')}</div>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-100">
            <tr>
              <th className="text-right p-4 font-medium text-gray-500">{t('colShowroom')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colPlan')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colAmount')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colStatus')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colDate')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colChargeId')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map((p) => {
              const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.INITIATED
              const StatusIcon = st.icon
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-[#0F3460]">{p.subscription.showroom.name}</div>
                    {p.subscription.showroom.showroomNumber && (
                      <div className="text-xs text-gray-400 font-mono">{formatShowroomId(p.subscription.showroom.showroomNumber)}</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{p.subscription.plan.nameAr}</td>
                  <td className="p-4">
                    <span className="price-number font-mono ltr text-[#C9A84C]">{Number(p.amount).toFixed(0)}</span> {p.currency}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                      <StatusIcon size={11} />
                      {t(`statuses.${p.status}` as Parameters<typeof t>[0]) ?? p.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">
                    {(p.paidAt ?? p.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4 text-gray-400 text-xs font-mono ltr">{p.tapChargeId.slice(0, 16)}…</td>
                </tr>
              )
            })}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-gray-400">
                <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                {t('empty')}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
