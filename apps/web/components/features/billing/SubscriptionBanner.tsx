'use client'

/**
 * SubscriptionBanner — shown at the top of the dashboard when:
 * - Trial ending soon (< 5 days)
 * - Status is PAST_DUE
 * - Status is CANCELLED / EXPIRED
 * - No subscription at all
 */

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { AlertTriangle, Clock, CreditCard, X } from 'lucide-react'
import { useState } from 'react'
import type { SubscriptionWithPlan } from '@/repositories/plan.repository'

interface Props { subscription: SubscriptionWithPlan | null }

export function SubscriptionBanner({ subscription }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // No subscription
  if (!subscription) {
    return (
      <Banner
        type="warning"
        icon={<AlertTriangle size={16} />}
        message="لم تختر باقة بعد — ابدأ تجربتك المجانية الآن"
        cta="اختر باقة"
        onCta={() => router.push(`/${locale}/pricing`)}
        onDismiss={() => setDismissed(true)}
      />
    )
  }

  const { status, trialEndsAt } = subscription

  if (status === 'PAST_DUE') {
    return (
      <Banner
        type="danger"
        icon={<CreditCard size={16} />}
        message="دفعة الاشتراك متأخرة — جدّد الآن لتجنب تعطيل الخدمة"
        cta="ادفع الآن"
        onCta={() => router.push(`/${locale}/billing`)}
        onDismiss={() => setDismissed(true)}
      />
    )
  }

  if (status === 'CANCELLED' || status === 'EXPIRED') {
    return (
      <Banner
        type="danger"
        icon={<AlertTriangle size={16} />}
        message={`اشتراكك ${status === 'CANCELLED' ? 'ملغي' : 'منتهي'} — فعّله مجدداً للوصول إلى جميع الميزات`}
        cta="تفعيل الاشتراك"
        onCta={() => router.push(`/${locale}/billing`)}
        onDismiss={() => setDismissed(true)}
      />
    )
  }

  if (status === 'TRIAL' && trialEndsAt) {
    const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 5 && daysLeft >= 0) {
      return (
        <Banner
          type="info"
          icon={<Clock size={16} />}
          message={`تنتهي تجربتك المجانية خلال ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'} — فعّل اشتراكك لاستمرار الخدمة`}
          cta="فعّل الآن"
          onCta={() => router.push(`/${locale}/billing`)}
          onDismiss={() => setDismissed(true)}
        />
      )
    }
  }

  return null
}

function Banner({
  type,
  icon,
  message,
  cta,
  onCta,
  onDismiss,
}: {
  type: 'warning' | 'danger' | 'info'
  icon: React.ReactNode
  message: string
  cta: string
  onCta: () => void
  onDismiss: () => void
}) {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger:  'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }
  const ctaStyles = {
    warning: 'bg-amber-600 hover:bg-amber-700',
    danger:  'bg-red-600 hover:bg-red-700',
    info:    'bg-blue-600 hover:bg-blue-700',
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border rounded-[8px] text-sm ${styles[type]}`} dir="rtl">
      {icon}
      <span className="flex-1">{message}</span>
      <button
        onClick={onCta}
        className={`text-white text-xs font-semibold px-3 py-1.5 rounded-[6px] transition-colors ${ctaStyles[type]}`}
      >
        {cta}
      </button>
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}
