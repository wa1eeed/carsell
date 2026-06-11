'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  PlusCircle,
  Pencil,
  RefreshCw,
  Upload,
  Trash2,
  Receipt,
  Tag,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'

interface Activity {
  id: string
  eventType: string
  userName: string
  createdAt: Date | string
}

const EVENT_META: Record<string, { icon: LucideIcon; color: string }> = {
  CAR_CREATED:     { icon: PlusCircle, color: '#1B7A4A' },
  FIELD_UPDATED:   { icon: Pencil, color: '#475569' },
  STATUS_CHANGED:  { icon: RefreshCw, color: '#0F3460' },
  FILE_UPLOADED:   { icon: Upload, color: '#3730A3' },
  FILE_DELETED:    { icon: Trash2, color: '#9B1C1C' },
  SALE_REGISTERED: { icon: Receipt, color: '#C9A84C' },
  PRICE_CHANGED:   { icon: Tag, color: '#B45309' },
  NOTE_ADDED:      { icon: MessageSquare, color: '#475569' },
}

export function ActivityFeed({ activity }: { activity: Activity[] }) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const locale = useLocale()

  return (
    <section className="cl-card">
      <h2 className="font-semibold mb-4">{t('activityFeed')}</h2>
      {activity.length === 0 ? (
        <p className="text-sm text-cl-gray-400">{tc('noData')}</p>
      ) : (
        <ul className="space-y-3">
          {activity.map((a) => {
            const meta = EVENT_META[a.eventType] ?? EVENT_META.FIELD_UPDATED
            const Icon = meta.icon
            return (
              <li key={a.id} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${meta.color}1A`, color: meta.color }}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-cl-text-primary truncate">{a.userName}</p>
                  <p className="text-xs text-cl-gray-400">{formatDateTime(a.createdAt, locale)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
