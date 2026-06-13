'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CarCard, type CarCardData } from './CarCard'
import { InventoryFilters } from './InventoryFilters'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function InventoryView({ cars }: { cars: CarCardData[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const t = useTranslations('car.fields')
  const tc = useTranslations('common')
  const locale = useLocale()
  const prefix = locale === 'ar' ? '' : '/en'

  return (
    <div className="space-y-4">
      <InventoryFilters view={view} onViewChange={setView} />

      {cars.length === 0 ? (
        <div className="cl-card text-center text-cl-gray-400 py-12">{tc('noData')}</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cars.map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      ) : (
        <div className="cl-card !p-0 overflow-hidden">
          <table className="cl-table">
            <thead>
              <tr>
                <th className="text-start">{t('brand')}</th>
                <th className="text-start">{t('year')}</th>
                <th className="text-start">{t('odometer')}</th>
                <th className="text-start">{t('price')}</th>
                <th className="text-start">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => (window.location.href = `${prefix}/inventory/${c.carPublicId ?? c.carRefNumber}`)}>
                  <td>{c.brandName} {c.categoryName}</td>
                  <td>{c.year}</td>
                  <td>{c.odometer ?? '—'}</td>
                  <td>{c.sellPrice != null ? <Price value={c.sellPrice} size="sm" /> : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
