import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Check, ArrowLeft, ArrowRight, Star } from 'lucide-react'

interface Props {
  locale: string
}

export async function PricingTeaser({ locale }: Props) {
  const t = await getTranslations('landing.pricing')
  const isRtl = locale === 'ar'
  const prefix = locale === 'ar' ? '' : '/en'
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  const plans = [
    {
      nameKey: 'starterName' as const,
      descKey: 'starterDesc' as const,
      highlightKey: 'starterHighlight' as const,
      features: ['حتى 20 سيارة', 'صفحة معرض', 'حساب الضريبة', 'دعم بريد إلكتروني'],
      featured: false,
      ctaStyle: 'border border-[#0F3460] text-[#0F3460] hover:bg-[#0F3460] hover:text-white',
    },
    {
      nameKey: 'growthName' as const,
      descKey: 'growthDesc' as const,
      highlightKey: 'growthHighlight' as const,
      features: ['حتى 100 سيارة', 'CarSell Live', 'مزادات إلكترونية', 'تقارير متقدمة', 'دعم شات'],
      featured: true,
      ctaStyle: 'bg-[#C9A84C] text-white hover:bg-[#b8973b]',
    },
    {
      nameKey: 'proName' as const,
      descKey: 'proDesc' as const,
      highlightKey: 'proHighlight' as const,
      features: ['سيارات غير محدودة', 'API Access', 'فريق غير محدود', 'مدير حساب', 'أولوية دعم'],
      featured: false,
      ctaStyle: 'border border-[#0F3460] text-[#0F3460] hover:bg-[#0F3460] hover:text-white',
    },
  ]

  return (
    <section className="bg-[#F8FAFC] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3460] mb-4">{t('title')}</h2>
          <p className="text-gray-500 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.featured ? 'border-[#C9A84C] shadow-md' : 'border-gray-100'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 bg-[#C9A84C] text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <Star size={10} fill="white" />
                  {t(plan.highlightKey)}
                </div>
              )}

              {!plan.featured && (
                <div className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
                  {t(plan.highlightKey)}
                </div>
              )}
              {plan.featured && <div className="h-8" />}

              <h3 className="text-xl font-bold text-[#0F3460] mb-1">{t(plan.nameKey)}</h3>
              <p className="text-gray-500 text-sm mb-5">{t(plan.descKey)}</p>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={14} className="text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`${prefix}/pricing`}
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle}`}
              >
                {t('viewAll')}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href={`${prefix}/pricing`}
            className="inline-flex items-center gap-2 text-[#0F3460] font-semibold hover:text-[#C9A84C] transition-colors"
          >
            {t('viewAll')}
            <ArrowIcon size={16} />
          </Link>
          <p className="text-gray-400 text-sm mt-2">{t('trialNote')}</p>
        </div>
      </div>
    </section>
  )
}
