'use client'

import { useLocale } from 'next-intl'
import { Car, TrendingUp, TrendingDown, Coins, Users, Building2, type LucideIcon } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { Price } from '@/components/ui/Price'
import { cn } from '@/lib/utils'

export type KpiIcon = 'car' | 'sales' | 'revenue' | 'users' | 'showrooms'

const ICONS: Record<KpiIcon, LucideIcon> = {
  car:       Car,
  sales:     TrendingUp,
  revenue:   Coins,
  users:     Users,
  showrooms: Building2,
}

const ICON_COLORS: Record<KpiIcon, { bg: string; text: string }> = {
  car:       { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  sales:     { bg: 'bg-green-50',  text: 'text-green-600'  },
  revenue:   { bg: 'bg-amber-50',  text: 'text-amber-600'  },
  users:     { bg: 'bg-purple-50', text: 'text-purple-600' },
  showrooms: { bg: 'bg-sky-50',    text: 'text-sky-600'    },
}

export function KpiCard({
  label,
  value,
  icon,
  isPrice = false,
  trend,
}: {
  label: string
  value: number
  icon: KpiIcon
  isPrice?: boolean
  trend?: { value: number; label?: string }
}) {
  const locale = useLocale()
  const Icon   = ICONS[icon]
  const colors = ICON_COLORS[icon]
  const isUp   = (trend?.value ?? 0) >= 0

  return (
    <div className="group relative bg-white rounded-card border border-cl-gray-200 p-5 hover:shadow-md hover:border-cl-gray-400 transition-all duration-200">
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-card bg-gradient-to-r from-cl-primary/30 to-cl-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-[10px]', colors.bg)}>
          <Icon size={18} className={colors.text} />
        </div>
        {trend && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
            isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <div className="space-y-1">
        {isPrice ? (
          <Price value={value} size="lg" />
        ) : (
          <p className="text-2xl font-bold text-cl-text-primary tabular-nums">
            {formatNumber(value, locale)}
          </p>
        )}
        <p className="text-xs text-cl-text-secondary font-medium">{label}</p>
      </div>
    </div>
  )
}
