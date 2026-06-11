'use client'

/**
 * PlanGate — wraps UI that requires a specific plan feature.
 * If the showroom's plan doesn't include the feature, shows an upgrade prompt.
 *
 * Usage:
 *   <PlanGate feature="AUCTIONS" subscription={sub}>
 *     <AuctionsPage />
 *   </PlanGate>
 */

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Lock, ArrowUpCircle } from 'lucide-react'
import { planHasFeature, type Feature } from '@/lib/feature-gate'
import type { SubscriptionWithPlan } from '@/repositories/plan.repository'

interface Props {
  feature:      Feature
  subscription: SubscriptionWithPlan | null
  children:     React.ReactNode
  inline?:      boolean   // show inline locked state instead of full page
}

const FEATURE_LABELS: Record<Feature, string> = {
  MARKET:           'CarSell Live',
  AUCTIONS:         'المزادات',
  API:              'API Access',
  REPORTS_ADVANCED: 'التقارير المتقدمة',
  REPORTS_FULL:     'التقارير الكاملة',
  CUSTOM_SHOWROOM:  'صفحة المعرض المخصصة',
  TEAM_MEMBERS:     'أعضاء إضافيين',
}

export function PlanGate({ feature, subscription, children, inline = false }: Props) {
  const router = useRouter()
  const locale = useLocale()

  const isLocked =
    !subscription ||
    subscription.status === 'CANCELLED' ||
    subscription.status === 'EXPIRED' ||
    !planHasFeature(subscription.plan.features, feature)

  if (!isLocked) return <>{children}</>

  if (inline) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-[8px] border border-gray-200 text-sm text-gray-500">
        <Lock size={14} />
        <span>{FEATURE_LABELS[feature]} غير متاحة في باقتك الحالية</span>
        <button
          onClick={() => router.push(`/${locale}/billing`)}
          className="mr-auto text-xs text-[#C9A84C] font-medium hover:underline flex items-center gap-1"
        >
          <ArrowUpCircle size={12} /> ترقية
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8" dir="rtl">
      <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mb-4">
        <Lock size={28} className="text-[#C9A84C]" />
      </div>
      <h2 className="text-xl font-bold text-[#0F3460] mb-2">
        {FEATURE_LABELS[feature]} غير متاحة
      </h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        هذه الميزة غير مشمولة في باقتك الحالية
        {subscription ? ` (${subscription.plan.nameAr})` : ''}.
        ترقّى إلى باقة أعلى للوصول إليها.
      </p>
      <button
        onClick={() => router.push(`/${locale}/billing`)}
        className="flex items-center gap-2 bg-[#C9A84C] text-white px-6 py-3 rounded-[8px] font-semibold"
      >
        <ArrowUpCircle size={18} />
        ترقية الباقة
      </button>
      <button
        onClick={() => router.back()}
        className="mt-3 text-sm text-gray-400 hover:text-gray-600"
      >
        رجوع
      </button>
    </div>
  )
}
