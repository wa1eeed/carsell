'use client'

import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut, Menu, Store, ExternalLink } from 'lucide-react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ROOT_DOMAIN } from '@/lib/constants'

export function Topbar({ showroomName, onMenuClick }: { showroomName: string; onMenuClick?: () => void }) {
  const t = useTranslations('nav')
  const locale = useLocale()

  return (
    <header className="h-16 shrink-0 bg-white border-b border-cl-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden text-cl-gray-600 hover:text-cl-primary"
            aria-label="menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="font-medium text-cl-text-primary truncate">{showroomName}</div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* CarSell Live — opens the public marketplace in a new tab */}
        <a
          href={`/${locale}/market`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-input px-3 py-1.5 text-sm font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
          title={t('market')}
        >
          <Store size={16} />
          <span className="hidden sm:inline">{t('market')}</span>
          <ExternalLink size={12} className="opacity-60" />
        </a>
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `https://${ROOT_DOMAIN}${locale === 'ar' ? '/login' : '/en/login'}` })}
          className="flex items-center gap-1.5 rounded-input px-3 py-1.5 text-sm text-cl-gray-600 hover:bg-cl-gray-100"
        >
          <LogOut size={16} />
          {t('logout')}
        </button>
      </div>
    </header>
  )
}
