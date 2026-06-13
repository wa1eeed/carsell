'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { ROOT_DOMAIN } from '@/lib/constants'
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
  Layers,
  Tag,
  type LucideIcon,
} from 'lucide-react'

interface NavItem { href: string; labelKey: string; icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',                  labelKey: 'overview',  icon: LayoutDashboard },
  { href: '/admin/showrooms',        labelKey: 'showrooms', icon: Building2       },
  { href: '/admin/plans',            labelKey: 'plans',     icon: Layers          },
  { href: '/admin/payments',         labelKey: 'payments',  icon: CreditCard      },
  { href: '/admin/kyc',              labelKey: 'kyc',       icon: ShieldCheck     },
  { href: '/admin/settings/brands',  labelKey: 'brands',    icon: Tag             },
  { href: '/admin/settings',         labelKey: 'settings',  icon: Settings        },
]
// Note: these hrefs resolve to /[locale]/admin/* in the app router
// On admin.carsell.one, middleware rewrites the subdomain to these paths

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode
  adminName: string
}) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('adminShell')

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin' || pathname === '/ar/admin'
      : href === '/admin/settings'
        ? pathname === '/admin/settings' || pathname === '/ar/admin/settings'
        : pathname.startsWith(href) || pathname.startsWith(`/ar${href}`)

  return (
    <div className="flex h-screen bg-gray-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`w-64 shrink-0 bg-white flex flex-col shadow-sm sticky top-0 h-screen ${locale === 'ar' ? 'border-l' : 'border-r'} border-gray-200`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F3460] rounded-[6px] flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">CarSell</div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon   = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm transition-all ${
                  active
                    ? 'bg-[#0F3460] text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{t(`nav.${item.labelKey}`)}</span>
                {active && <ChevronRight size={14} className={`opacity-60 ${locale === 'ar' ? 'rotate-180' : ''}`} />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-[#0F3460] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {adminName[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{adminName}</div>
              <div className="text-[10px] text-gray-400">{t('platformAdmin')}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: `https://${ROOT_DOMAIN}${locale === 'ar' ? '/admin/login' : '/en/admin/login'}` })}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-[8px] text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-400">admin.carsell.one</span>
            <ChevronRight size={12} className={locale === 'ar' ? 'rotate-180' : ''} />
            <span className="text-gray-700 font-medium">
              {NAV_ITEMS.find((n) => isActive(n.href)) ? t(`nav.${NAV_ITEMS.find((n) => isActive(n.href))!.labelKey}`) : t('controlPanel')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Super Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
