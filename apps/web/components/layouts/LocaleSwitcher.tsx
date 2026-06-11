'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Languages } from 'lucide-react'

/**
 * Toggles between /ar and /en while preserving the current path.
 */
export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const other = locale === 'ar' ? 'en' : 'ar'

  function switchLocale() {
    // pathname starts with /<locale> (localePrefix: as-needed → /en/... , and / for ar)
    const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
    const next = other === 'ar' ? stripped : `/en${stripped}`
    router.push(next === '' ? '/' : next)
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      className="flex items-center gap-1.5 rounded-input border border-cl-gray-200 px-3 py-1.5 text-sm text-cl-gray-600 hover:border-cl-gray-400"
    >
      <Languages size={16} />
      {other === 'ar' ? 'العربية' : 'English'}
    </button>
  )
}
