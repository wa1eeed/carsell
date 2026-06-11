'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/format'

/**
 * Price — always Gold (#C9A84C) + IBM Plex Mono + LTR.
 */
export function Price({
  value,
  size = 'md',
  withCurrency = true,
}: {
  value: number | string
  size?: 'sm' | 'md' | 'lg'
  withCurrency?: boolean
}) {
  const locale = useLocale()
  const tc = useTranslations('common')
  const cls = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <span className={`price-number font-semibold text-cl-accent ${cls}`}>
      {formatPrice(value, locale)}
      {withCurrency && <span className="text-xs me-1"> {tc('sar')}</span>}
    </span>
  )
}
