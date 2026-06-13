'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutGrid, List, Filter, Search } from 'lucide-react'

const STATUSES = ['FOR_SALE', 'AUCTION', 'RESERVED', 'SOLD', 'DRAFT'] as const

export function InventoryFilters({ view, onViewChange }: { view: 'grid' | 'list'; onViewChange: (v: 'grid' | 'list') => void }) {
  const t = useTranslations('car')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search size={15} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-cl-gray-400 pointer-events-none" />
        <input
          className="cl-input !ps-8 !w-48"
          type="search"
          placeholder={tc('search')}
          defaultValue={params.get('q') ?? ''}
          onKeyDown={(e) => { if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value) }}
          onBlur={(e) => setParam('q', e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5 text-sm text-cl-gray-600">
        <Filter size={16} /> {tc('filter')}
      </div>

      <select className="cl-input !w-auto" value={params.get('status') ?? ''} onChange={(e) => setParam('status', e.target.value)}>
        <option value="">{t('fields.status')}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`status.${s}`)}
          </option>
        ))}
      </select>

      <input
        className="cl-input !w-28"
        type="number"
        placeholder={t('fields.year')}
        defaultValue={params.get('year') ?? ''}
        onBlur={(e) => setParam('year', e.target.value)}
      />

      <input
        className="cl-input !w-32 price-number"
        type="number"
        placeholder={`${tc('total')} ↓`}
        defaultValue={params.get('minPrice') ?? ''}
        onBlur={(e) => setParam('minPrice', e.target.value)}
      />
      <input
        className="cl-input !w-32 price-number"
        type="number"
        placeholder={`${tc('total')} ↑`}
        defaultValue={params.get('maxPrice') ?? ''}
        onBlur={(e) => setParam('maxPrice', e.target.value)}
      />

      <div className="ms-auto flex items-center gap-1 rounded-input border border-cl-gray-200 p-0.5">
        <button
          type="button"
          onClick={() => onViewChange('grid')}
          className={`p-1.5 rounded ${view === 'grid' ? 'bg-cl-primary-light text-cl-primary' : 'text-cl-gray-400'}`}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className={`p-1.5 rounded ${view === 'list' ? 'bg-cl-primary-light text-cl-primary' : 'text-cl-gray-400'}`}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  )
}
