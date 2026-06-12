import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight, Play, TrendingUp, Car, BarChart3, DollarSign } from 'lucide-react'

interface Props {
  locale: string
}

export async function HeroSection({ locale }: Props) {
  const t = await getTranslations('landing.hero')
  const isRtl = locale === 'ar'
  const prefix = locale === 'ar' ? '' : '/en'
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0F3460]">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -end-40 w-96 h-96 rounded-full bg-[#C9A84C]/10 blur-3xl" />
        <div className="absolute top-1/2 -start-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 end-1/4 w-80 h-80 rounded-full bg-[#C9A84C]/5 blur-3xl" />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <div className="text-center lg:text-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-[#C9A84C] text-sm font-medium">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('headline')}
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              {t('subheadline')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href={`${prefix}/register`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C9A84C] hover:bg-[#b8973b] text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40 hover:-translate-y-0.5"
              >
                {t('ctaPrimary')}
                <ArrowIcon size={18} />
              </Link>
              <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded-xl font-medium text-base transition-all backdrop-blur-sm">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Play size={12} className="ms-0.5" fill="white" />
                </div>
                {t('ctaSecondary')}
              </button>
            </div>

            {/* Trial note */}
            <p className="mt-4 text-sm text-white/50">{t('trialNote')}</p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative lg:ps-4">
            {/* Floating outer frame */}
            <div className="relative rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl p-1 max-w-md mx-auto lg:max-w-none">
              {/* Window chrome */}
              <div className="bg-[#0a2544] rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-md px-3 py-1 text-xs text-white/40 text-center">
                      app.carsell.one/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-4 space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">{t('kpi1Label')}</span>
                        <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                          <Car size={14} className="text-[#C9A84C]" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white font-mono" dir="ltr">{t('kpi1Value')}</div>
                      <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <TrendingUp size={10} />
                        +12%
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">{t('kpi2Label')}</span>
                        <div className="w-7 h-7 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                          <DollarSign size={14} className="text-[#C9A84C]" />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-[#C9A84C] font-mono" dir="ltr">
                        {t('kpi2Value')}
                      </div>
                      <div className="text-xs text-white/40 mt-1">{t('kpi2Unit')}</div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">{t('kpi3Label')}</span>
                        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <BarChart3 size={14} className="text-green-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white font-mono" dir="ltr">{t('kpi3Value')}</div>
                      <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <TrendingUp size={10} />
                        +5%
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">{t('kpi4Label')}</span>
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <TrendingUp size={14} className="text-blue-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white font-mono" dir="ltr">{t('kpi4Value')}</div>
                      <div className="text-xs text-white/40 mt-1">↑ هذا الشهر</div>
                    </div>
                  </div>

                  {/* Mini car list */}
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                      <span className="text-white/70 text-xs font-medium">آخر الإضافات</span>
                      <span className="text-[#C9A84C] text-xs">عرض الكل</span>
                    </div>
                    {[
                      { name: 'Toyota Land Cruiser 2023', price: '189,000', badge: 'نشط', color: 'green' },
                      { name: 'Lexus LX 600 2024', price: '310,000', badge: 'سوم', color: 'yellow' },
                      { name: 'BMW X5 2022', price: '145,000', badge: 'مزاد', color: 'blue' },
                    ].map((car, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <Car size={14} className="text-white/50" />
                          </div>
                          <span className="text-white/80 text-xs">{car.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#C9A84C] text-xs font-mono" dir="ltr">{car.price}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              car.color === 'green'
                                ? 'bg-green-500/20 text-green-400'
                                : car.color === 'yellow'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {car.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent card */}
            <div className="absolute -bottom-4 -start-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">صفقة جديدة</div>
                <div className="text-sm font-bold text-[#0F3460]">+189,000 ر.س</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
    </section>
  )
}
