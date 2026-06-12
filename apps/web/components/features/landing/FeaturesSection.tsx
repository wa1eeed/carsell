import { getTranslations } from 'next-intl/server'
import { Car, Calculator, Layers, Globe, Store, BarChart3 } from 'lucide-react'

export async function FeaturesSection() {
  const t = await getTranslations('landing.features')

  const cards = [
    { Icon: Car,        color: 'text-blue-600',    bg: 'bg-blue-50',   title: t('inventory.title'), desc: t('inventory.desc') },
    { Icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-50', title: t('profit.title'),   desc: t('profit.desc') },
    { Icon: Layers,     color: 'text-purple-600',  bg: 'bg-purple-50', title: t('saleModes.title'), desc: t('saleModes.desc') },
    { Icon: Globe,      color: 'text-[#C9A84C]',   bg: 'bg-amber-50',  title: t('market.title'),   desc: t('market.desc') },
    { Icon: Store,      color: 'text-[#0F3460]',   bg: 'bg-sky-50',    title: t('showroom.title'), desc: t('showroom.desc') },
    { Icon: BarChart3,  color: 'text-pink-600',    bg: 'bg-pink-50',   title: t('reports.title'),  desc: t('reports.desc') },
  ]

  return (
    <section id="features" className="bg-[#F8FAFC] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3460] mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">{t('subtitle')}</p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ Icon, color, bg, title, desc }, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#0F3460]/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
              </div>
              <h3 className="text-lg font-bold text-[#0F3460] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
