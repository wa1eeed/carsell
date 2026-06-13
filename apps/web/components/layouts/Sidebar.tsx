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
import { cn } from '@/lib/utils'

interface NavItem    { href: string; labelKey: string; icon: LucideIcon; badge?: number }
interface NavSection { titleKey: string; items: NavItem[] }

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
    <aside
      className="w-[240px] shrink-0 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0F3460 0%, #0A2540 100%)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-cl-accent flex items-center justify-center shadow-lg">
            <Car size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">CarSell</span>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest leading-none mt-0.5">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
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
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-all duration-150',
                        active
                          ? 'bg-white/15 text-white shadow-inner'
                          : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                      )}
                    >
                      <Icon
                        size={16}
                        className={cn('shrink-0 transition-colors', active ? 'text-cl-accent' : 'text-white/50 group-hover:text-white/80')}
                      />
                      <span className="flex-1 font-medium">{t(item.labelKey)}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cl-accent shrink-0" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom decoration */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-white/40 font-medium">carsell.one</span>
        </div>
      </div>
    </aside>
  )
}
