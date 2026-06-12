'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Inbox, CalendarClock, HandCoins, ShoppingCart, Phone,
  Check, X, Loader2, MessageSquare, Clock,
} from 'lucide-react'
import { formatCarRef } from '@/lib/format'

interface RequestItem {
  id: string
  type: 'RESERVATION' | 'SOUM_OFFER' | 'PURCHASE'
  status: string
  buyerName: string
  buyerPhone: string
  offerAmount: number | null
  message: string | null
  dealerNote: string | null
  createdAt: string
  car: {
    ref: number; year: number; sellPrice: number | null
    brandAr: string; brandEn: string; categoryAr: string; categoryEn: string; cover: string | null
  }
}

interface Props {
  requests:     RequestItem[]
  counts:       { pending: number; accepted: number; rejected: number; completed: number; total: number }
  activeStatus: string
}

const TYPE_META = {
  RESERVATION: { icon: CalendarClock, color: 'text-blue-600 bg-blue-50' },
  SOUM_OFFER:  { icon: HandCoins,     color: 'text-amber-600 bg-amber-50' },
  PURCHASE:    { icon: ShoppingCart,  color: 'text-green-600 bg-green-50' },
} as const

export function RequestsClient({ requests, counts, activeStatus }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const t  = useTranslations('requests')
  const ar = locale === 'ar'
  const [busy, setBusy] = useState<string | null>(null)

  async function act(id: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') {
    setBusy(id)
    await fetch(`/api/v1/requests/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setBusy(null)
    router.refresh()
  }

  const tabs = [
    { key: 'PENDING',   label: t('tabs.pending'),   count: counts.pending },
    { key: 'ACCEPTED',  label: t('tabs.accepted'),  count: counts.accepted },
    { key: 'COMPLETED', label: t('tabs.completed'), count: counts.completed },
    { key: 'REJECTED',  label: t('tabs.rejected'),  count: counts.rejected },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">{t('title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const active = activeStatus === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/${locale}/requests?status=${tab.key}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium border transition-all ${
                active ? 'bg-[#0F3460] text-white border-[#0F3460]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100'}`}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-gray-100 p-12 text-center text-gray-400">
          <Inbox size={36} className="mx-auto mb-3 text-gray-300" />
          {t('empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const meta = TYPE_META[r.type]
            const Icon = meta.icon
            return (
              <div key={r.id} className="bg-white rounded-[12px] border border-gray-100 p-4">
                <div className="flex items-start gap-4">
                  {/* Car thumb */}
                  <div className="w-16 h-16 rounded-[8px] bg-gray-100 overflow-hidden shrink-0">
                    {r.car.cover
                      ? <img src={r.car.cover} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        <Icon size={11} /> {t(`type.${r.type}`)}
                      </span>
                      <span className="font-medium text-[#0F3460]">
                        {ar ? `${r.car.brandAr} ${r.car.categoryAr}` : `${r.car.brandEn} ${r.car.categoryEn}`} {r.car.year}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{formatCarRef(r.car.ref)}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-600">
                      <span>{r.buyerName}</span>
                      <a href={`tel:${r.buyerPhone}`} className="flex items-center gap-1 text-[#0F3460] hover:underline font-mono ltr">
                        <Phone size={12} /> {r.buyerPhone}
                      </a>
                    </div>

                    {r.offerAmount != null && (
                      <div className="mt-1.5 text-sm">
                        <span className="text-gray-400">{t('offer')}: </span>
                        <span className="price-number font-mono text-[#C9A84C] font-semibold ltr">{r.offerAmount.toLocaleString('en-US')}</span>
                        {r.car.sellPrice && (
                          <span className="text-xs text-gray-400 mr-2">
                            ({t('listed')}: <span className="font-mono ltr">{r.car.sellPrice.toLocaleString('en-US')}</span>)
                          </span>
                        )}
                      </div>
                    )}

                    {r.message && (
                      <div className="mt-1.5 text-sm text-gray-500 flex items-start gap-1.5">
                        <MessageSquare size={13} className="mt-0.5 shrink-0" /> {r.message}
                      </div>
                    )}

                    <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {new Date(r.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')}
                    </div>
                  </div>

                  {/* Actions */}
                  {r.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => act(r.id, 'ACCEPTED')}
                        disabled={busy === r.id}
                        className="flex items-center justify-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-[6px] text-sm hover:bg-green-600 disabled:opacity-50"
                      >
                        {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {t('accept')}
                      </button>
                      <button
                        onClick={() => act(r.id, 'REJECTED')}
                        disabled={busy === r.id}
                        className="flex items-center justify-center gap-1 border border-red-200 text-red-500 px-3 py-1.5 rounded-[6px] text-sm hover:bg-red-50"
                      >
                        <X size={13} /> {t('reject')}
                      </button>
                    </div>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <button
                      onClick={() => act(r.id, 'COMPLETED')}
                      disabled={busy === r.id}
                      className="self-center bg-[#0F3460] text-white px-3 py-1.5 rounded-[6px] text-sm hover:bg-[#0d2d54] disabled:opacity-50 shrink-0"
                    >
                      {t('markCompleted')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
