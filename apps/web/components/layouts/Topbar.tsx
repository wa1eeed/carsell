'use client'

import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut, Menu, Store, Bell, ExternalLink, Building2 } from 'lucide-react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ROOT_DOMAIN } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Topbar({ showroomName, showroomSlug, onMenuClick }: { showroomName: string; showroomSlug?: string | null; onMenuClick?: () => void }) {
  const t      = useTranslations('nav')
  const locale = useLocale()

  const initials = showroomName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 shrink-0 bg-white border-b border-cl-gray-200 flex items-center justify-between px-4 md:px-6 gap-4">
      {/* Left — hamburger + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-[6px] text-cl-gray-600 hover:bg-cl-gray-100 transition-colors"
            aria-label="menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-cl-primary flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">{initials}</span>
          </div>
          <span className="text-sm font-semibold text-cl-text-primary truncate max-w-[180px]">{showroomName}</span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        {/* My Showroom */}
        {showroomSlug && (
          <a
            href={`https://${showroomSlug}.${ROOT_DOMAIN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold text-cl-primary border border-cl-primary/20 hover:bg-cl-primary/5 transition-colors"
          >
            <Building2 size={13} />
            {t('myShowroom')}
            <ExternalLink size={11} className="opacity-50" />
          </a>
        )}
        {/* CarSell Market */}
        <a
          href={`https://${ROOT_DOMAIN}/${locale}/market`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold text-cl-accent border border-cl-accent/30 hover:bg-cl-accent/5 transition-colors"
        >
          <Store size={13} />
          CarSell Market
          <ExternalLink size={11} className="opacity-50" />
        </a>

        {/* Notification bell */}
        <button
          type="button"
          className="relative p-2 rounded-[8px] text-cl-gray-600 hover:bg-cl-gray-100 transition-colors"
          aria-label="notifications"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-cl-accent border-2 border-white" />
        </button>

        <div className="w-px h-5 bg-cl-gray-200 mx-0.5" />

        <LocaleSwitcher />

        {/* User menu */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `https://${ROOT_DOMAIN}${locale === 'ar' ? '/login' : '/en/login'}` })}
          className={cn(
            'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-sm text-cl-gray-600',
            'hover:bg-red-50 hover:text-red-600 transition-colors'
          )}
          title={t('logout')}
        >
          <LogOut size={15} />
          <span className="hidden md:inline text-xs font-medium">{t('logout')}</span>
        </button>
      </div>
    </header>
  )
}
