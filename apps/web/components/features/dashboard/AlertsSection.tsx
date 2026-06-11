'use client'

import { useTranslations } from 'next-intl'
import { ShieldAlert, CalendarClock, Gavel, CheckCircle2 } from 'lucide-react'

interface Alerts {
  kycPending: number
  expiringSubscriptions: number
  auctionEnding: number
}

export function AlertsSection({ alerts }: { alerts: Alerts }) {
  const t = useTranslations('dashboard')

  const items = [
    { key: 'kyc', count: alerts.kycPending, label: t('kycPending'), icon: ShieldAlert, tone: 'warning' as const },
    {
      key: 'subs',
      count: alerts.expiringSubscriptions,
      label: t('expiringSubscriptions'),
      icon: CalendarClock,
      tone: 'danger' as const,
    },
    { key: 'auction', count: alerts.auctionEnding, label: t('auctionEndingSoon'), icon: Gavel, tone: 'primary' as const },
  ].filter((i) => i.count > 0)

  const toneClass: Record<string, string> = {
    warning: 'bg-cl-warning-light text-cl-warning',
    danger: 'bg-cl-danger-light text-cl-danger',
    primary: 'bg-cl-primary-light text-cl-primary',
  }

  return (
    <section className="cl-card">
      <h2 className="font-semibold mb-4">{t('alerts')}</h2>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-cl-success">
          <CheckCircle2 size={18} /> {t('alerts')} — 0
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(({ key, count, label, icon: Icon, tone }) => (
            <li key={key} className={`flex items-center gap-3 rounded-input p-3 text-sm ${toneClass[tone]}`}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
