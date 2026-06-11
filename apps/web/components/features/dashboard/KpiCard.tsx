'use client'

import { useLocale } from 'next-intl'
import { Car, TrendingUp, Coins, Users, Building2, type LucideIcon } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { Price } from '@/components/ui/Price'

export type KpiIcon = 'car' | 'sales' | 'revenue' | 'users' | 'showrooms'

// Map name → component on the client (server components can't pass functions across the boundary).
const ICONS: Record<KpiIcon, LucideIcon> = {
  car: Car,
  sales: TrendingUp,
  revenue: Coins,
  users: Users,
  showrooms: Building2,
}

export function KpiCard({
  label,
  value,
  icon,
  isPrice = false,
}: {
  label: string
  value: number
  icon: KpiIcon
  isPrice?: boolean
}) {
  const locale = useLocale()
  const Icon = ICONS[icon]

  return (
    <div className="cl-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-cl-gray-600">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-input bg-cl-primary-light">
          <Icon size={16} className="text-cl-primary" />
        </span>
      </div>
      {isPrice ? (
        <Price value={value} size="lg" />
      ) : (
        <span className="text-2xl font-semibold text-cl-text-primary">{formatNumber(value, locale)}</span>
      )}
    </div>
  )
}
