'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Inbox,
  Gavel,
  Car,
  Users,
  Receipt,
  BarChart3,
  Settings,
  CreditCard,
  type LucideIcon,
} from 'lucide-react'

interface NavItem   { href: string; labelKey: string; icon: LucideIcon }
interface NavSection { titleKey: string; items: NavItem[] }

/**
 * Showroom sidebar — for showroom owners/staff only.
 * Super Admin has a completely separate layout (AdminShell) at admin.carsell.one
 */
const SECTIONS: NavSection[] = [
  {
    titleKey: 'sections.platform',
    items: [
      { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
      { href: '/requests',  labelKey: 'requests',  icon: Inbox           },
      { href: '/auctions',  labelKey: 'auctions',  icon: Gavel           },
    ],
  },
  {
    titleKey: 'sections.inventory',
    items: [
      { href: '/inventory', labelKey: 'inventory', icon: Car   },
      { href: '/customers', labelKey: 'customers', icon: Users },
    ],
  },
  {
    titleKey: 'sections.finance',
    items: [
      { href: '/sales',   labelKey: 'sales',   icon: Receipt   },
      { href: '/reports', labelKey: 'reports', icon: BarChart3 },
    ],
  },
  {
    titleKey: 'sections.settings',
    items: [
      { href: '/settings', labelKey: 'settings', icon: Settings   },
      { href: '/billing',  labelKey: 'billing',  icon: CreditCard },
    ],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const t        = useTranslations('nav')
  const locale   = useLocale()
  const pathname = usePathname()

  const prefix   = locale === 'ar' ? '' : '/en'
  const isActive = (href: string) =>
    pathname === `${prefix}${href}` || pathname.startsWith(`${prefix}${href}/`)

  return (
    <aside className="w-60 shrink-0 min-h-screen flex flex-col" style={{ background: '#0F3460' }}>
      <div className="px-6 py-5">
        <span className="text-xl font-semibold text-white">CarSell</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <p
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(248,250,252,0.45)' }}
            >
              {t(section.titleKey)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const Icon   = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={`${prefix}${item.href}`}
                      onClick={onNavigate}
                      className="flex items-center gap-3 px-3 py-2 rounded-input text-sm transition-colors"
                      style={{
                        background:     active ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color:          active ? '#fff' : 'rgba(255,255,255,0.65)',
                        borderInlineEnd: active ? '3px solid #C9A84C' : '3px solid transparent',
                      }}
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
