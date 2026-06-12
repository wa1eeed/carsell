'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Languages, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function LandingNavbar() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const prefix = locale === 'ar' ? '' : '/en'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function switchLocale() {
    const other = locale === 'ar' ? 'en' : 'ar'
    const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
    const next = other === 'ar' ? stripped : `/en${stripped}`
    router.push(next === '' ? '/' : next)
  }

  const navLinks = [
    { label: t('features'), href: `${prefix}/#features` },
    { label: t('pricing'), href: `${prefix}/pricing` },
    { label: t('market'), href: `${prefix}/market` },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={prefix || '/'}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 bg-[#0F3460] rounded-lg flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-sm">C</span>
            </div>
            <span className={`font-bold text-lg tracking-tight ${scrolled ? 'text-[#0F3460]' : 'text-white'}`}>
              CarSell
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scrolled
                    ? 'text-gray-600 hover:text-[#0F3460] hover:bg-gray-50'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={switchLocale}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                scrolled
                  ? 'text-gray-500 hover:text-[#0F3460] border border-gray-200 hover:border-gray-400'
                  : 'text-white/70 hover:text-white border border-white/20 hover:border-white/50'
              }`}
            >
              <Languages size={15} />
              {locale === 'ar' ? 'EN' : 'ع'}
            </button>

            <Link
              href={`${prefix}/login`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-[#0F3460] hover:bg-gray-50'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('login')}
            </Link>

            <Link
              href={`${prefix}/register`}
              className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b8973b] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              {t('startTrial')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-[#0F3460]' : 'text-white'
            }`}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white rounded-xl shadow-xl border border-gray-100 mt-2 mb-4 overflow-hidden">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#0F3460] hover:bg-gray-50 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 p-4 flex flex-col gap-2">
              <Link
                href={`${prefix}/login`}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-sm font-medium text-[#0F3460] border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {t('login')}
              </Link>
              <Link
                href={`${prefix}/register`}
                onClick={() => setMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-sm font-semibold bg-[#C9A84C] text-white rounded-lg hover:bg-[#b8973b]"
              >
                {t('startTrial')}
              </Link>
              <button
                onClick={() => { switchLocale(); setMenuOpen(false) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400"
              >
                <Languages size={15} />
                {locale === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
