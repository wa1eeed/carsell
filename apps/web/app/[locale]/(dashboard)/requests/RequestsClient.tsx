'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  Inbox, CalendarClock, HandCoins, ShoppingCart, Phone,
  Check, X, Loader2, MessageSquare, Clock, ChevronRight,
  Banknote, FileText, User,
} from 'lucide-react'
import { formatCarRef } from '@/lib/format'
import toast from 'react-hot-toast'

type RequestStatus =
  | 'PENDING' | 'RESERVED' | 'WAITING_PAYMENT'
  | 'OWNERSHIP_TRANSFER' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

interface RequestItem {
  id: string
  type: 'RESERVATION' | 'SOUM_OFFER' | 'PURCHASE'
  status: RequestStatus
  buyerName: string
  buyerPhone: string
  offerAmount: number | null
  message: string | null
  dealerNote: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string | null } | null
  car: {
    ref: number; year: number; sellPrice: number | null
    brandAr: string; brandEn: string; categoryAr: string; categoryEn: string; cover: string | null
  }
}

interface Props {
  requests:     RequestItem[]
  counts: {
    pending: number; reserved: number; waitingPayment: number
    ownershipTransfer: number; completed: number; rejected: number; cancelled: number; total: number
  }
  activeStatus: string
}

const TYPE_META = {
  RESERVATION: { icon: CalendarClock, color: 'text-blue-600 bg-blue-50' },
  SOUM_OFFER:  { icon: HandCoins,     color: 'text-amber-600 bg-amber-50' },
  PURCHASE:    { icon: ShoppingCart,  color: 'text-green-600 bg-green-50' },
} as const

// Visual badge per status
const STATUS_STYLE: Record<RequestStatus, { label: string; cls: string }> = {
  PENDING:            { label: 'قيد الانتظار',     cls: 'bg-amber-50 text-amber-600' },
  RESERVED:           { label: 'محجوزة',            cls: 'bg-blue-50 text-blue-600' },
  WAITING_PAYMENT:    { label: 'بانتظار الدفع',     cls: 'bg-purple-50 text-purple-600' },
  OWNERSHIP_TRANSFER: { label: 'نقل الملكية',       cls: 'bg-indigo-50 text-indigo-600' },
  COMPLETED:          { label: 'مكتملة',            cls: 'bg-green-50 text-green-600' },
  REJECTED:           { label: 'مرفوضة',            cls: 'bg-red-50 text-red-500' },
  CANCELLED:          { label: 'ملغاة',             cls: 'bg-gray-100 text-gray-400' },
}

// Next valid transitions per current status
const NEXT_ACTIONS: Record<RequestStatus, { status: RequestStatus; label: string; cls: string }[]> = {
  PENDING: [
    { status: 'RESERVED', label: 'قبول الطلب', cls: 'bg-green-500 text-white hover:bg-green-600' },
    { status: 'REJECTED', label: 'رفض',         cls: 'border border-red-200 text-red-500 hover:bg-red-50' },
  ],
  RESERVED: [
    { status: 'WAITING_PAYMENT',    label: 'تم الاتفاق — انتظار الدفع', cls: 'bg-[#0F3460] text-white hover:bg-[#0d2d54]' },
    { status: 'CANCELLED',          label: 'إلغاء',                      cls: 'border border-gray-200 text-gray-500 hover:bg-gray-50' },
  ],
  WAITING_PAYMENT: [
    { status: 'OWNERSHIP_TRANSFER', label: 'تم الدفع — نقل الملكية', cls: 'bg-[#0F3460] text-white hover:bg-[#0d2d54]' },
    { status: 'CANCELLED',          label: 'إلغاء',                   cls: 'border border-gray-200 text-gray-500 hover:bg-gray-50' },
  ],
  OWNERSHIP_TRANSFER: [
    { status: 'COMPLETED', label: 'اكتمل نقل الملكية ✓', cls: 'bg-green-500 text-white hover:bg-green-600' },
    { status: 'CANCELLED', label: 'إلغاء',                cls: 'border border-gray-200 text-gray-500 hover:bg-gray-50' },
  ],
  COMPLETED:  [],
  REJECTED:   [],
  CANCELLED:  [],
}

export function RequestsClient({ requests, counts, activeStatus }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const locale   = useLocale()
  const t  = useTranslations('requests')
  const ar = locale === 'ar'

  function goStatus(s: string) {
    router.push(`${pathname}?status=${s}`)
  }
  const [busy, setBusy] = useState<string | null>(null)

  async function act(id: string, status: RequestStatus) {
    setBusy(id)
    try {
      const res  = await fetch(`/api/v1/requests/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(STATUS_STYLE[status].label)
        router.refresh()
      } else {
        toast.error('حدث خطأ، حاول مرة أخرى')
      }
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى')
    } finally {
      setBusy(null)
    }
  }

  const tabs = [
    { key: 'PENDING',            label: 'قيد الانتظار',   count: counts.pending },
    { key: 'RESERVED',           label: 'محجوزة',          count: counts.reserved },
    { key: 'WAITING_PAYMENT',    label: 'انتظار الدفع',    count: counts.waitingPayment },
    { key: 'OWNERSHIP_TRANSFER', label: 'نقل الملكية',     count: counts.ownershipTransfer },
    { key: 'COMPLETED',          label: 'مكتملة',          count: counts.completed },
    { key: 'REJECTED',           label: 'مرفوضة',          count: counts.rejected },
    { key: 'CANCELLED',          label: 'ملغاة',           count: counts.cancelled },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">{t('title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Stage pipeline — visual progress bar */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-4">
        <div className="flex items-center gap-1 text-xs">
          {(['PENDING','RESERVED','WAITING_PAYMENT','OWNERSHIP_TRANSFER','COMPLETED'] as RequestStatus[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => goStatus(s)}
                className={`flex-1 text-center py-1.5 rounded-[6px] font-medium transition-all ${
                  activeStatus === s
                    ? 'bg-[#0F3460] text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {STATUS_STYLE[s].label}
                {(counts as Record<string, number>)[['pending','reserved','waitingPayment','ownershipTransfer','completed'][i]] > 0 && (
                  <span className={`mr-1 px-1 rounded-full text-[10px] ${activeStatus === s ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {(counts as Record<string, number>)[['pending','reserved','waitingPayment','ownershipTransfer','completed'][i]]}
                  </span>
                )}
              </button>
              {i < 4 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
            </div>
          ))}
        </div>
        {/* Rejected / Cancelled tabs */}
        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
          {(['REJECTED','CANCELLED'] as RequestStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => goStatus(s)}
              className={`text-xs px-3 py-1 rounded-[6px] border transition-all ${
                activeStatus === s
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
            >
              {STATUS_STYLE[s].label}
              {' '}
              {s === 'REJECTED' ? counts.rejected : counts.cancelled}
            </button>
          ))}
        </div>
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
            const meta    = TYPE_META[r.type]
            const Icon    = meta.icon
            const actions = NEXT_ACTIONS[r.status] ?? []
            const badge   = STATUS_STYLE[r.status]

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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><User size={12} className="text-gray-400" /> {r.buyerName}</span>
                      <a href={`tel:${r.buyerPhone}`} className="flex items-center gap-1 text-[#0F3460] hover:underline font-mono ltr">
                        <Phone size={12} /> {r.buyerPhone}
                      </a>
                      {r.customer && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">عميل مسجّل ✓</span>
                      )}
                    </div>

                    {r.offerAmount != null && (
                      <div className="mt-1.5 text-sm flex items-center gap-1">
                        <Banknote size={13} className="text-gray-400" />
                        <span className="text-gray-400">{t('offer')}: </span>
                        <span className="price-number font-mono text-[#C9A84C] font-semibold ltr">{r.offerAmount.toLocaleString('en-US')}</span>
                        {r.car.sellPrice && (
                          <span className="text-xs text-gray-400 mr-1">
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

                    {r.dealerNote && (
                      <div className="mt-1.5 text-sm text-[#0F3460] bg-blue-50 rounded-[6px] px-2 py-1 flex items-start gap-1.5">
                        <FileText size={12} className="mt-0.5 shrink-0" /> {r.dealerNote}
                      </div>
                    )}

                    <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} /> {new Date(r.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-US')}
                    </div>
                  </div>

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {actions.map((a) => (
                        <button
                          key={a.status}
                          onClick={() => act(r.id, a.status)}
                          disabled={busy === r.id}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-[6px] text-sm font-medium disabled:opacity-50 transition-colors ${a.cls}`}
                        >
                          {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : null}
                          {a.label}
                        </button>
                      ))}
                    </div>
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
