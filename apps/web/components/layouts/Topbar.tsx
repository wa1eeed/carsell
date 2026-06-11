'use client'

import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut, Menu } from 'lucide-react'
import { LocaleSwitcher } from './LocaleSwitcher'

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
        <LocaleSwitcher />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="flex items-center gap-1.5 rounded-input px-3 py-1.5 text-sm text-cl-gray-600 hover:bg-cl-gray-100"
        >
          <LogOut size={16} />
          {t('logout')}
        </button>
      </div>
    </header>
  )
}
