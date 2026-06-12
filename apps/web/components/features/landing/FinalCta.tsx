import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

interface Props {
  locale: string
}

export async function FinalCta({ locale }: Props) {
  const t = await getTranslations('landing.finalCta')
  const isRtl = locale === 'ar'
  const prefix = locale === 'ar' ? '' : '/en'
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <section className="bg-[#0F3460] py-20 lg:py-28 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute -top-20 -end-20 w-80 h-80 rounded-full bg-[#C9A84C]/10 blur-3xl" />
      <div className="absolute -bottom-20 -start-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
          {t('title')}
        </h2>
        <p className="text-white/70 text-xl mb-10 leading-relaxed">
          {t('subtitle')}
        </p>

        <Link
          href={`${prefix}/register`}
          className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973b] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40 hover:-translate-y-0.5"
        >
          {t('cta')}
          <ArrowIcon size={20} />
        </Link>

        <div className="flex items-center justify-center gap-2 mt-5 text-white/50 text-sm">
          <ShieldCheck size={16} />
          {t('note')}
        </div>
      </div>
    </section>
  )
}
