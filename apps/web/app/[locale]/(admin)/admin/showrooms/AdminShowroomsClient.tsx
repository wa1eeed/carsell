'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Building2, CheckCircle, AlertCircle, XCircle, Clock, Loader2, ChevronDown } from 'lucide-react'

type Sub = {
  id: string
  status: string
  billingPeriod: string
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  createdAt: Date
  plan: { id: string; nameAr: string; priceMonthly: unknown; slug: string }
  showroom: { id: string; name: string; city: string | null; logoUrl: string | null }
}

type Plan = { id: string; nameAr: string; slug: string; priceMonthly: unknown }

interface Props {
  subscriptions:  Sub[]
  plans:          Plan[]
  totalShowrooms: number
  page:           number
}

const STATUS_STYLES: Record<string, string> = {
  TRIAL:    'bg-blue-50 text-blue-600 border-blue-200',
  ACTIVE:   'bg-green-50 text-green-600 border-green-200',
  PAST_DUE: 'bg-orange-50 text-orange-600 border-orange-200',
  CANCELLED:'bg-red-50 text-red-500 border-red-200',
  EXPIRED:  'bg-gray-100 text-gray-500 border-gray-200',
  SUSPENDED:'bg-red-50 text-red-600 border-red-200',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  TRIAL:    <Clock size={11} />,
  ACTIVE:   <CheckCircle size={11} />,
  PAST_DUE: <AlertCircle size={11} />,
  CANCELLED:<XCircle size={11} />,
  EXPIRED:  <XCircle size={11} />,
  SUSPENDED:<AlertCircle size={11} />,
}

export default function AdminShowroomsClient({ subscriptions, plans, totalShowrooms, page }: Props) {
  const router = useRouter()
  const t = useTranslations('adminShowrooms')
  const [saving, setSaving] = useState<string | null>(null)

  async function updateSub(showroomId: string, patch: { status?: string; planId?: string }) {
    setSaving(showroomId)
    try {
      await fetch(`/api/v1/admin/showrooms/${showroomId}/subscription`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  const statusFilters = ['', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED']

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3460]">{t('title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t('total')} {totalShowrooms}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => router.push(s ? `?status=${s}` : '?')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s === ''
                  ? 'border-[#0F3460] bg-[#0F3460] text-white'
                  : `${STATUS_STYLES[s] ?? 'border-gray-200 text-gray-600'} hover:opacity-80`
              }`}
            >
              {s ? (t(`statusLabels.${s}` as Parameters<typeof t>[0]) ?? s) : t('filterAll')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-100">
            <tr>
              <th className="text-right p-4 font-medium text-gray-500">{t('colShowroom')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colPlan')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colStatus')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colExpiry')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colChangePlan')}</th>
              <th className="text-right p-4 font-medium text-gray-500">{t('colChangeStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">

                {/* Showroom */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#0F3460]/10 rounded-full flex items-center justify-center shrink-0">
                      {sub.showroom.logoUrl ? (
                        <img src={sub.showroom.logoUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
                      ) : (
                        <Building2 size={15} className="text-[#0F3460]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F3460]">{sub.showroom.name}</div>
                      <div className="text-xs text-gray-400">{sub.showroom.city ?? '—'}</div>
                    </div>
                  </div>
                </td>

                {/* Current Plan */}
                <td className="p-4">
                  <div className="font-medium text-gray-800">{sub.plan.nameAr}</div>
                  <div className="text-xs text-gray-400">
                    {sub.billingPeriod === 'YEARLY' ? t('yearly') : t('monthly')} ·{' '}
                    {Number(sub.plan.priceMonthly).toLocaleString('ar-SA')} {t('sar')}
                  </div>
                </td>

                {/* Status badge */}
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[sub.status] ?? ''}`}>
                    {STATUS_ICONS[sub.status]}
                    {t(`statusLabels.${sub.status}` as Parameters<typeof t>[0]) ?? sub.status}
                  </span>
                </td>

                {/* Expiry */}
                <td className="p-4 text-gray-500 text-xs">
                  {sub.status === 'TRIAL' && sub.trialEndsAt
                    ? new Date(sub.trialEndsAt).toLocaleDateString('ar-SA')
                    : sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString('ar-SA')
                    : '—'}
                </td>

                {/* Change Plan */}
                <td className="p-4">
                  <div className="relative">
                    <select
                      defaultValue={sub.plan.id}
                      disabled={saving === sub.showroom.id}
                      onChange={(e) => updateSub(sub.showroom.id, { planId: e.target.value })}
                      className="appearance-none text-xs border border-gray-200 rounded-[8px] px-3 py-2 pr-7 bg-white focus:outline-none focus:border-[#0F3460] cursor-pointer disabled:opacity-50 min-w-[120px]"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameAr}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </td>

                {/* Change Status */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        defaultValue={sub.status}
                        disabled={saving === sub.showroom.id}
                        onChange={(e) => updateSub(sub.showroom.id, { status: e.target.value })}
                        className="appearance-none text-xs border border-gray-200 rounded-[8px] px-3 py-2 pr-7 bg-white focus:outline-none focus:border-[#0F3460] cursor-pointer disabled:opacity-50 min-w-[100px]"
                      >
                        <option value="TRIAL">{t('statusOptions.TRIAL')}</option>
                        <option value="ACTIVE">{t('statusOptions.ACTIVE')}</option>
                        <option value="PAST_DUE">{t('statusOptions.PAST_DUE')}</option>
                        <option value="SUSPENDED">{t('statusOptions.SUSPENDED')}</option>
                        <option value="CANCELLED">{t('statusOptions.CANCELLED')}</option>
                        <option value="EXPIRED">{t('statusOptions.EXPIRED')}</option>
                      </select>
                      <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {saving === sub.showroom.id && (
                      <Loader2 size={14} className="animate-spin text-[#0F3460]" />
                    )}
                  </div>
                </td>

              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        {page > 1 && (
          <button
            onClick={() => router.push(`?page=${page - 1}`)}
            className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm hover:bg-gray-50"
          >
            {t('prev')}
          </button>
        )}
        {subscriptions.length === 25 && (
          <button
            onClick={() => router.push(`?page=${page + 1}`)}
            className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm hover:bg-gray-50"
          >
            {t('next')}
          </button>
        )}
      </div>
    </div>
  )
}
