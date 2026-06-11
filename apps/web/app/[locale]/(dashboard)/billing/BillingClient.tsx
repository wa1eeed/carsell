'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle, AlertCircle, Clock, XCircle, ArrowUpCircle, Calendar } from 'lucide-react'
import type { SubscriptionWithPlan, PlanWithFeatures } from '@/repositories/plan.repository'

interface Props {
  subscription: SubscriptionWithPlan | null
  plans: PlanWithFeatures[]
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  TRIAL:    { label: 'تجربة مجانية', color: 'text-blue-600 bg-blue-50',  icon: <Clock size={14} /> },
  ACTIVE:   { label: 'نشط',          color: 'text-green-600 bg-green-50', icon: <CheckCircle size={14} /> },
  PAST_DUE: { label: 'دفعة متأخرة',  color: 'text-orange-600 bg-orange-50', icon: <AlertCircle size={14} /> },
  CANCELLED:{ label: 'ملغي',         color: 'text-red-600 bg-red-50',    icon: <XCircle size={14} /> },
  EXPIRED:  { label: 'منتهي',        color: 'text-gray-600 bg-gray-100', icon: <XCircle size={14} /> },
  SUSPENDED:{ label: 'موقوف',        color: 'text-red-600 bg-red-50',    icon: <AlertCircle size={14} /> },
}

export default function BillingClient({ subscription, plans }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const status = subscription?.status ?? 'TRIAL'
  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.TRIAL

  async function handlePayNow() {
    setLoading(true)
    const res = await fetch('/api/v1/subscriptions/checkout', { method: 'POST' })
    const data = await res.json() as { checkoutUrl?: string }
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl
    } else {
      setLoading(false)
    }
  }

  async function handleChangePlan(planId: string) {
    await fetch('/api/v1/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    router.refresh()
    setShowUpgrade(false)
  }

  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500 mb-4">لا يوجد اشتراك نشط</p>
        <button
          onClick={() => router.push('/ar/pricing')}
          className="bg-[#0F3460] text-white px-6 py-3 rounded-[8px] font-medium"
        >
          اختر باقة
        </button>
      </div>
    )
  }

  const plan = subscription.plan
  const isYearly = subscription.billingPeriod === 'YEARLY'
  const price = isYearly ? plan.priceYearly : plan.priceMonthly

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-[#0F3460]">الاشتراك والفواتير</h1>

      {/* Current plan card */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F3460]">{plan.nameAr}</h2>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${statusInfo.color}`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
          </div>
          <div className="text-right">
            <div className="price-number text-2xl font-bold text-[#C9A84C] font-mono ltr">
              {Number(price).toFixed(0)}
            </div>
            <div className="text-gray-400 text-xs">ريال / {isYearly ? 'سنة' : 'شهر'}</div>
          </div>
        </div>

        {/* Period info */}
        {subscription.currentPeriodEnd && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Calendar size={14} />
            <span>
              {status === 'TRIAL' ? 'تنتهي التجربة المجانية في' : 'يتجدد في'}{' '}
              <span className="font-medium text-gray-700">
                {new Date(
                  status === 'TRIAL'
                    ? subscription.trialEndsAt ?? subscription.currentPeriodEnd
                    : subscription.currentPeriodEnd,
                ).toLocaleDateString('ar-SA')}
              </span>
            </span>
          </div>
        )}
        {subscription.trialEndsAt && status === 'TRIAL' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mb-4">
            <Clock size={14} />
            <span>
              ينتهي وقت التجربة في{' '}
              <span className="font-medium">{new Date(subscription.trialEndsAt).toLocaleDateString('ar-SA')}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {(status === 'TRIAL' || status === 'PAST_DUE') && (
            <button
              onClick={handlePayNow}
              disabled={loading}
              className="flex items-center gap-2 bg-[#C9A84C] text-white px-5 py-2.5 rounded-[8px] font-medium text-sm hover:bg-[#b8973b] disabled:opacity-50"
            >
              <CreditCard size={16} />
              {loading ? 'جاري التحويل...' : 'ادفع الآن'}
            </button>
          )}
          <button
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 border border-[#0F3460] text-[#0F3460] px-5 py-2.5 rounded-[8px] font-medium text-sm hover:bg-[#0F3460]/5"
          >
            <ArrowUpCircle size={16} />
            تغيير الباقة
          </button>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[12px] p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#0F3460] mb-4">اختر باقة جديدة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleChangePlan(p.id)}
                  className={`text-right p-4 rounded-[8px] border-2 transition-all hover:-translate-y-0.5 ${
                    p.id === plan.id
                      ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                      : 'border-gray-100 hover:border-[#0F3460]/30'
                  }`}
                >
                  <div className="font-bold text-[#0F3460]">{p.nameAr}</div>
                  <div className="price-number text-[#C9A84C] font-mono ltr text-lg mt-1">
                    {Number(p.priceMonthly).toFixed(0)}{' '}
                    <span className="text-gray-400 text-xs font-sans">ريال/شهر</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.maxCars === null ? 'سيارات غير محدودة' : `حتى ${p.maxCars} سيارة`}
                  </div>
                  {p.id === plan.id && (
                    <span className="text-xs text-[#C9A84C] font-medium">الباقة الحالية</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-4 text-gray-400 text-sm hover:text-gray-600"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
