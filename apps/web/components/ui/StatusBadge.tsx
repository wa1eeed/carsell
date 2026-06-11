'use client'

import { useTranslations } from 'next-intl'

type CarStatus = 'DRAFT' | 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD'

const BADGE_CLASS: Record<CarStatus, string> = {
  DRAFT:    'badge-draft',
  FOR_SALE: 'badge-available',
  AUCTION:  'badge-auction',
  RESERVED: 'badge-reserved',
  SOLD:     'badge-sold',
}

export function StatusBadge({ status }: { status: CarStatus }) {
  const t = useTranslations('car.status')
  return <span className={`badge ${BADGE_CLASS[status]}`}>{t(status)}</span>
}
