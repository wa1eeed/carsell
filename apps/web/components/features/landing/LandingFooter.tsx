import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Twitter, Instagram, Linkedin } from 'lucide-react'

interface Props {
  locale: string
}

export async function LandingFooter({ locale }: Props) {
  const t = await getTranslations('landing.footer')
  const prefix = locale === 'ar' ? '' : '/en'

  const columns = [
    {
      labelKey: 'productLabel' as const,
      links: [
        { labelKey: 'features' as const, href: `${prefix}/#features` },
        { labelKey: 'pricing' as const, href: `${prefix}/pricing` },
        { labelKey: 'market' as const, href: `${prefix}/market` },
      ],
    },
    {
      labelKey: 'companyLabel' as const,
      links: [
        { labelKey: 'about' as const, href: `${prefix}/about` },
        { labelKey: 'blog' as const, href: `${prefix}/blog` },
        { labelKey: 'contact' as const, href: `${prefix}/contact` },
      ],
    },
    {
      labelKey: 'legalLabel' as const,
      links: [
        { labelKey: 'privacy' as const, href: `${prefix}/privacy` },
        { labelKey: 'terms' as const, href: `${prefix}/terms` },
      ],
    },
  ]

  return (
    <footer className="bg-[#0F3460] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-[#C9A84C] font-bold text-lg">C</span>
              </div>
              <span className="text-white font-bold text-xl">CarSell</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Icon size={16} className="text-white/70" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-white/90 font-semibold text-sm mb-4">{t(col.labelKey)}</h4>
              <ul className="space-y-3">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">{t('copyright')}</p>
          <a
            href={locale === 'ar' ? '/en' : '/'}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            {t('switchLang')}
          </a>
        </div>
      </div>
    </footer>
  )
}
