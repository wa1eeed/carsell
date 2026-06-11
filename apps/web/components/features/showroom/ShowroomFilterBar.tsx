'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Filter } from 'lucide-react'

interface BrandOption {
  id: string
  nameAr: string
  nameEn: string
}

const CONDITIONS = ['NEW', 'USED', 'USED_QUALIFIED'] as const

export function ShowroomFilterBar({ brands }: { brands: BrandOption[] }) {
  const t = useTranslations('car')
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="bg-white border-b border-cl-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm text-cl-gray-600">
          <Filter size={16} /> {tc('filter')}
        </span>

        <select className="cl-input !w-auto" value={params.get('brand') ?? ''} onChange={(e) => setParam('brand', e.target.value)}>
          <option value="">{t('fields.brand')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.nameAr}</option>
          ))}
        </select>

        <select className="cl-input !w-auto" value={params.get('condition') ?? ''} onChange={(e) => setParam('condition', e.target.value)}>
          <option value="">{t('fields.carType')}</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{t(`type.${c}`)}</option>
          ))}
        </select>

        <input
          className="cl-input !w-24"
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
      </div>
    </div>
  )
}
