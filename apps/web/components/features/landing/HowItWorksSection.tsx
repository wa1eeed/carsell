import { getTranslations } from 'next-intl/server'
import { UserCheck, Car, Megaphone } from 'lucide-react'

export async function HowItWorksSection() {
  const t = await getTranslations('landing.howItWorks')

  const steps = [
    {
      number: t('step1Number'),
      title: t('step1Title'),
      desc: t('step1Desc'),
      Icon: UserCheck,
      color: 'text-[#0F3460]',
      bg: 'bg-[#0F3460]/10',
    },
    {
      number: t('step2Number'),
      title: t('step2Title'),
      desc: t('step2Desc'),
      Icon: Car,
      color: 'text-[#C9A84C]',
      bg: 'bg-[#C9A84C]/10',
    },
    {
      number: t('step3Number'),
      title: t('step3Title'),
      desc: t('step3Desc'),
      Icon: Megaphone,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-[#C9A84C]/15 text-[#C9A84C] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            كيف يعمل
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3460] mb-4">{t('title')}</h2>
          <p className="text-gray-500 text-lg">{t('subtitle')}</p>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 start-[16.666%] end-[16.666%] h-0.5 bg-gradient-to-r from-[#0F3460]/20 via-[#C9A84C]/40 to-emerald-200" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Step number badge */}
                <div className="relative mb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <step.Icon size={28} className={step.color} />
                  </div>
                  <div
                    className={`absolute -top-2 -end-2 w-6 h-6 rounded-full bg-white border-2 border-[#0F3460] flex items-center justify-center text-xs font-bold text-[#0F3460]`}
                  >
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#0F3460] mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
