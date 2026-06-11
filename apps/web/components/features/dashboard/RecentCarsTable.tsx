'use client'

import { useTranslations } from 'next-intl'
import { Car } from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { RecentCar } from '@/repositories/dashboard.repository'

export function RecentCarsTable({ cars }: { cars: RecentCar[] }) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const tcar = useTranslations('car.fields')
  const tsrc = useTranslations('car.source')

  return (
    <section className="cl-card !p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <Car size={18} className="text-cl-primary" />
        <h2 className="font-semibold">{t('recentCars')}</h2>
      </div>

      {cars.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-cl-gray-400">{tc('noData')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="cl-table">
            <thead>
              <tr>
                <th className="text-start">{tcar('brand')}</th>
                <th className="text-start">{tcar('vin')}</th>
                <th className="text-start">{t('showrooms')}</th>
                <th className="text-start">{tcar('price')}</th>
                <th className="text-start">{tc('status')}</th>
                <th className="text-start">{tc('source')}</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td><span className="vin">{c.vin ?? '—'}</span></td>
                  <td>{c.showroomName}</td>
                  <td>{c.price != null ? <Price value={c.price} size="sm" /> : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-xs text-cl-gray-600">{safeSource(c.source, tsrc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function safeSource(source: string, tsrc: (k: string) => string): string {
  try {
    return tsrc(source)
  } catch {
    return source
  }
}
