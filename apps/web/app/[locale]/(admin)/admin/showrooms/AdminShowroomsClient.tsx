'use client'

import { useRouter } from 'next/navigation'
import { Building2, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

type Sub = {
  id: string
  status: string
  billingPeriod: string
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  createdAt: Date
  plan: { nameAr: string; priceMonthly: unknown; slug: string }
  showroom: { id: string; name: string; city: string | null; logoUrl: string | null }
}

interface Props { subscriptions: Sub[]; page: number }

const STATUS_STYLES: Record<string, string> = {
  TRIAL:    'bg-blue-50 text-blue-600',
  ACTIVE:   'bg-green-50 text-green-600',
  PAST_DUE: 'bg-orange-50 text-orange-600',
  CANCELLED:'bg-red-50 text-red-500',
  EXPIRED:  'bg-gray-100 text-gray-500',
  SUSPENDED:'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'تجربة', ACTIVE: 'نشط', PAST_DUE: 'متأخر', CANCELLED: 'ملغي', EXPIRED: 'منتهي', SUSPENDED: 'موقوف',
}

export default function AdminShowroomsClient({ subscriptions, page }: Props) {
  const router = useRouter()

  async function changePlanForShowroom(showroomId: string, newStatus: string) {
    await fetch(`/api/v1/admin/showrooms/${showroomId}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0F3460]">المعارض والاشتراكات</h1>
        <div className="flex gap-2">
          {['', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => router.push(`?status=${s}`)}
              className={`text-xs px-3 py-1.5 rounded-full border ${s ? '' : 'border-[#0F3460] text-[#0F3460]'}`}
            >
              {s ? (STATUS_LABELS[s] ?? s) : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-100">
            <tr>
              <th className="text-right p-4 font-medium text-gray-500">المعرض</th>
              <th className="text-right p-4 font-medium text-gray-500">الباقة</th>
              <th className="text-right p-4 font-medium text-gray-500">الحالة</th>
              <th className="text-right p-4 font-medium text-gray-500">تنتهي</th>
              <th className="text-right p-4 font-medium text-gray-500">تاريخ التسجيل</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0F3460]/10 rounded-full flex items-center justify-center">
                      {sub.showroom.logoUrl ? (
                        <img src={sub.showroom.logoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <Building2 size={14} className="text-[#0F3460]" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-[#0F3460]">{sub.showroom.name}</div>
                      <div className="text-xs text-gray-400">{sub.showroom.city ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium">{sub.plan.nameAr}</div>
                  <div className="text-xs text-gray-400">{sub.billingPeriod === 'YEARLY' ? 'سنوي' : 'شهري'}</div>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[sub.status] ?? ''}`}>
                    {STATUS_LABELS[sub.status] ?? sub.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-xs">
                  {sub.status === 'TRIAL' && sub.trialEndsAt
                    ? new Date(sub.trialEndsAt).toLocaleDateString('ar-SA')
                    : sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString('ar-SA')
                    : '—'}
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {new Date(sub.createdAt).toLocaleDateString('ar-SA')}
                </td>
                <td className="p-4">
                  <select
                    defaultValue={sub.status}
                    onChange={(e) => changePlanForShowroom(sub.showroom.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-[6px] px-2 py-1 focus:outline-none"
                  >
                    <option value="TRIAL">تجربة</option>
                    <option value="ACTIVE">نشط</option>
                    <option value="PAST_DUE">متأخر</option>
                    <option value="SUSPENDED">موقوف</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">لا توجد معارض</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {page > 1 && (
          <button onClick={() => router.push(`?page=${page - 1}`)} className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm">السابق</button>
        )}
        <button onClick={() => router.push(`?page=${page + 1}`)} className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm">التالي</button>
      </div>
    </div>
  )
}
