import { getTranslations } from 'next-intl/server'
import { Tag, Handshake, Gavel } from 'lucide-react'

export async function SaleModesSection() {
  const t = await getTranslations('landing.saleModes')

  const modes = [
    {
      Icon: Tag,
      titleKey: 'fixedTitle' as const,
      descKey: 'fixedDesc' as const,
      tagKey: 'fixedTag' as const,
      accent: '#0F3460',
      bg: 'bg-[#0F3460]',
      tagBg: 'bg-white/20',
      iconBg: 'bg-white/15',
      featured: false,
    },
    {
      Icon: Handshake,
      titleKey: 'soumTitle' as const,
      descKey: 'soumDesc' as const,
      tagKey: 'soumTag' as const,
      accent: '#C9A84C',
      bg: 'bg-[#C9A84C]',
      tagBg: 'bg-white/25',
      iconBg: 'bg-white/20',
      featured: true,
    },
    {
      Icon: Gavel,
      titleKey: 'auctionTitle' as const,
      descKey: 'auctionDesc' as const,
      tagKey: 'auctionTag' as const,
      accent: '#1a4a7a',
      bg: 'bg-gradient-to-br from-[#0F3460] to-[#1a4a7a]',
      tagBg: 'bg-[#C9A84C]/30',
      iconBg: 'bg-white/10',
      featured: false,
    },
  ]

  return (
    <section className="bg-[#F8FAFC] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3460] mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-500 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((mode, i) => (
            <div
              key={i}
              className={`relative rounded-2xl ${mode.bg} text-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${
                mode.featured ? 'ring-2 ring-[#C9A84C]/50 ring-offset-2' : ''
              }`}
            >
              {/* Tag */}
              <div className={`inline-flex items-center ${mode.tagBg} rounded-full px-3 py-1 text-xs font-semibold mb-6`}>
                {t(mode.tagKey)}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${mode.iconBg} flex items-center justify-center mb-5`}>
                <mode.Icon size={28} className="text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3">{t(mode.titleKey)}</h3>
              <p className="text-white/75 leading-relaxed text-sm">{t(mode.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
