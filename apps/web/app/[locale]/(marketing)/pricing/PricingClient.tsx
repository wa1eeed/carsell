'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Check, Star, Zap, BarChart3, Globe, Gavel, Code2, Users, Headphones } from 'lucide-react'
import type { PlanWithFeatures, PlanFeatures } from '@/repositories/plan.repository'

interface Props { plans: PlanWithFeatures[] }

type Period = 'MONTHLY' | 'YEARLY'

const FEATURE_ICONS: Record<keyof PlanFeatures, React.ReactNode> = {
  market:        <Globe size={14} />,
  auctions:      <Gavel size={14} />,
  api:           <Code2 size={14} />,
  reports:       <BarChart3 size={14} />,
  support:       <Headphones size={14} />,
  customShowroom: <Zap size={14} />,
  teamMembers:   <Users size={14} />,
}

const FEATURE_LABELS_AR: Record<string, string> = {
  market:        'CarSell Live',
  auctions:      'المزادات',
  api:           'API Access',
  reports:       'التقارير',
  support:       'الدعم',
  customShowroom: 'صفحة معرض مخصصة',
  teamMembers:   'أعضاء الفريق',
}

const REPORTS_AR: Record<string, string> = {
  basic:    'أساسية',
  advanced: 'متقدمة',
  full:     'كاملة',
}
const SUPPORT_AR: Record<string, string> = {
  email:     'بريد إلكتروني',
  chat:      'بريد + شات',
  priority:  'أولوية',
  dedicated: 'مدير حساب',
}

function featureValue(key: keyof PlanFeatures, val: PlanFeatures[typeof key]): string | boolean {
  if (key === 'reports') return REPORTS_AR[val as string] ?? String(val)
  if (key === 'support') return SUPPORT_AR[val as string] ?? String(val)
  if (key === 'teamMembers') return val === null ? 'غير محدود' : `${val} أعضاء`
  return val as boolean
}

export default function PricingClient({ plans }: Props) {
  const [period, setPeriod] = useState<Period>('MONTHLY')
  const router = useRouter()
  const locale = useLocale()

  const yearlyDiscount = 20

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="bg-[#0F3460] text-white text-center py-16 px-4">
        <h1 className="text-4xl font-bold mb-3">اختر الباقة المناسبة لمعرضك</h1>
        <p className="text-white/70 text-lg">جرّب مجاناً 14 يوم، بدون بطاقة ائتمان</p>

        {/* Period toggle */}
        <div className="inline-flex items-center gap-1 bg-white/10 rounded-full p-1 mt-8">
          <button
            onClick={() => setPeriod('MONTHLY')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              period === 'MONTHLY' ? 'bg-white text-[#0F3460]' : 'text-white/70 hover:text-white'
            }`}
          >
            شهري
          </button>
          <button
            onClick={() => setPeriod('YEARLY')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
              period === 'YEARLY' ? 'bg-white text-[#0F3460]' : 'text-white/70 hover:text-white'
            }`}
          >
            سنوي
            <span className="absolute -top-2 -left-2 bg-[#C9A84C] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              -{yearlyDiscount}%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = period === 'YEARLY' ? plan.priceYearly : plan.priceMonthly
            const yearlyMonthly = Number(plan.priceYearly) / 12

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-[12px] shadow-sm border-2 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.isFeatured
                    ? 'border-[#C9A84C] shadow-md'
                    : 'border-gray-100'
                }`}
              >
                {/* Featured badge */}
                {plan.isFeatured && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-[#C9A84C] text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star size={10} fill="white" /> موصى بها
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Plan name */}
                  <h2 className="text-xl font-bold text-[#0F3460] mb-1">{plan.nameAr}</h2>
                  {plan.descriptionAr && (
                    <p className="text-gray-500 text-sm mb-4">{plan.descriptionAr}</p>
                  )}

                  {/* Price */}
                  <div className="my-6">
                    {plan.isPublic ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="price-number text-3xl font-bold text-[#C9A84C] font-mono ltr">
                            {period === 'YEARLY'
                              ? yearlyMonthly.toFixed(0)
                              : Number(price).toFixed(0)}
                          </span>
                          <span className="text-gray-500 text-sm">ريال / شهر</span>
                        </div>
                        {period === 'YEARLY' && (
                          <p className="text-xs text-gray-400 mt-1">
                            يُفوتَر{' '}
                            <span className="price-number font-mono ltr text-[#C9A84C]">
                              {Number(plan.priceYearly).toFixed(0)}
                            </span>{' '}
                            ريال سنوياً
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xl font-bold text-[#0F3460]">تواصل معنا</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {plan.maxCars === null ? 'سيارات غير محدودة' : `حتى ${plan.maxCars} سيارة`}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {(Object.entries(plan.features) as [keyof PlanFeatures, PlanFeatures[keyof PlanFeatures]][]).map(
                      ([key, val]) => {
                        const display = featureValue(key, val)
                        const isDisabled = display === false
                        return (
                          <li
                            key={key}
                            className={`flex items-center gap-2 text-sm ${
                              isDisabled ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            <span className={isDisabled ? 'text-gray-300' : 'text-[#C9A84C]'}>
                              {isDisabled ? (
                                <span className="w-4 h-4 inline-flex items-center justify-center text-gray-300">—</span>
                              ) : (
                                <Check size={14} className="text-green-500" />
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-gray-400">{FEATURE_ICONS[key]}</span>
                              {FEATURE_LABELS_AR[key]}
                              {typeof display === 'string' && display && (
                                <span className="text-[#C9A84C] font-medium mr-1">{display}</span>
                              )}
                            </span>
                          </li>
                        )
                      },
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  {plan.isPublic ? (
                    <button
                      onClick={() =>
                        router.push(
                          `/${locale}/register?planId=${plan.id}&period=${period}`,
                        )
                      }
                      className={`w-full py-3 rounded-[8px] font-semibold transition-all text-sm ${
                        plan.isFeatured
                          ? 'bg-[#C9A84C] text-white hover:bg-[#b8973b]'
                          : 'bg-[#0F3460] text-white hover:bg-[#0d2d54]'
                      }`}
                    >
                      ابدأ التجربة المجانية
                    </button>
                  ) : (
                    <button className="w-full py-3 rounded-[8px] font-semibold bg-gray-100 text-[#0F3460] hover:bg-gray-200 transition-all text-sm">
                      تواصل مع المبيعات
                    </button>
                  )}
                  <p className="text-center text-xs text-gray-400 mt-2">
                    {plan.trialDays} يوم مجاناً • لا بطاقة ائتمان
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ / comparison note */}
        <p className="text-center text-gray-400 text-sm mt-10">
          جميع الباقات تشمل: لوحة تحكم كاملة، صفحة معرض مخصصة، تسجيل المبيعات، وحساب الضريبة تلقائياً.
        </p>
      </div>
    </div>
  )
}
