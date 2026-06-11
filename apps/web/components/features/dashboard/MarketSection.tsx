'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Store } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { Price } from '@/components/ui/Price'
import type { MarketStats } from '@/repositories/dashboard.repository'

export function MarketSection({ market }: { market: MarketStats }) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const locale = useLocale()
  const max = Math.max(1, ...market.brandBreakdown.map((b) => b.count))

  return (
    <section className="cl-card">
      <div className="flex items-center gap-2 mb-4">
        <Store size={18} className="text-cl-accent" />
        <h2 className="font-semibold">{t('marketSection')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-xs text-cl-gray-600 mb-1">{t('inventory')}</p>
          <p className="text-xl font-semibold">{formatNumber(market.listedCount, locale)}</p>
        </div>
        <div>
          <p className="text-xs text-cl-gray-600 mb-1">{t('revenue')}</p>
          <Price value={market.marketValue} size="md" />
        </div>
      </div>

      {market.brandBreakdown.length > 0 ? (
        <div className="space-y-2">
          {market.brandBreakdown.slice(0, 6).map((b) => (
            <div key={b.brand} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-cl-gray-600 truncate">{b.brand}</span>
              <div className="flex-1 h-2 rounded-full bg-cl-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(b.count / max) * 100}%`, background: '#0F3460' }} />
              </div>
              <span className="w-8 shrink-0 text-xs text-cl-gray-600 text-end">{formatNumber(b.count, locale)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-cl-gray-400">{tc('noData')}</p>
      )}
    </section>
  )
}
