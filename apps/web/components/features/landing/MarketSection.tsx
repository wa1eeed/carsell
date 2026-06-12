import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Globe, Users, Filter, Bell, ArrowLeft, ArrowRight } from 'lucide-react'

interface Props {
  locale: string
}

export async function MarketSection({ locale }: Props) {
  const t = await getTranslations('landing.market')
  const isRtl = locale === 'ar'
  const prefix = locale === 'ar' ? '' : '/en'
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  const points = [
    { Icon: Users, text: t('point1') },
    { Icon: Filter, text: t('point2') },
    { Icon: Bell, text: t('point3') },
  ]

  return (
    <section className="bg-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#0F3460] to-[#1a4a7a] rounded-3xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Text side */}
            <div className="p-10 lg:p-14 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 w-fit mb-6">
                <Globe size={14} className="text-[#C9A84C]" />
                <span className="text-[#C9A84C] text-sm font-semibold">{t('badge')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                {t('title')}
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                {t('desc')}
              </p>

              <ul className="space-y-4 mb-10">
                {points.map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-[#C9A84C]" />
                    </div>
                    <span className="text-white/80 leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`${prefix}/market`}
                className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973b] text-white px-6 py-3.5 rounded-xl font-semibold w-fit transition-colors shadow-lg"
              >
                {t('cta')}
                <ArrowIcon size={18} />
              </Link>
            </div>

            {/* Visual side — market mockup */}
            <div className="relative p-8 lg:p-10 flex items-center">
              <div className="w-full rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden shadow-xl">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">CarSell Live</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs">مباشر</span>
                  </div>
                </div>

                {/* Car listings */}
                <div className="p-4 space-y-3">
                  {[
                    { name: 'Toyota Camry 2024', price: '98,000', city: 'الرياض', views: '234', type: 'ثابت' },
                    { name: 'Hyundai Tucson 2023', price: '82,500', city: 'جدة', views: '189', type: 'سوم' },
                    { name: 'Kia Sportage 2024', price: '75,000', city: 'الدمام', views: '312', type: 'مزاد' },
                  ].map((car, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <Globe size={16} className="text-white/50" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{car.name}</div>
                          <div className="text-white/40 text-xs">{car.city} • {car.views} مشاهدة</div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-[#C9A84C] font-bold font-mono text-sm" dir="ltr">{car.price}</div>
                        <div className="text-white/40 text-xs">{car.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/10 text-center">
                  <span className="text-white/40 text-xs">+1,243 سيارة أخرى متاحة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
