'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, MapPin, Gauge, Fuel,
  X, Share2, MessageCircle, ChevronDown, ChevronLeft,
  ChevronRight, Zap, Tag, Gavel, Car, Filter,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

// ─── Types ────────────────────────────────────────────────────────────────────

type CarImage = { url: string }

type CarShowroom = {
  id: string
  name: string
  slug: string | null
  city: string | null
  logoUrl: string | null
  whatsapp: string | null
}

type MarketCar = {
  id: string
  year: number
  carType: string
  odometer: number | null
  fuelType: string | null
  transmission: string | null
  sellPrice: unknown
  status: string
  displayMode?: string | null
  brand:    { nameAr: string; nameEn: string; logoUrl?: string | null }
  category: { nameAr: string; bodyType?: string }
  model:    { name: string }
  images:   CarImage[]
  showroom: CarShowroom
}

interface FiltersData {
  brands: {
    id: string
    nameAr: string
    nameEn: string
    categories: { id: string; nameAr: string; models: { id: string; name: string }[] }[]
  }[]
  cities: string[]
}

interface Props {
  cars:           MarketCar[]
  total:          number
  page:           number
  pageSize:       number
  filtersData:    FiltersData
  currentFilters: Record<string, string | number | undefined>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_KEYS = [
  'brandId','categoryId','modelId','yearMin','yearMax',
  'priceMin','priceMax','city','carType','fuelType',
  'transmission','bodyType','q','sort','page',
] as const

type FilterKey = typeof FILTER_KEYS[number]

const BODY_TYPES       = ['SUV','SEDAN','PICKUP','COUPE','HATCHBACK','VAN','CONVERTIBLE','WAGON'] as const
const FUEL_TYPES_LIST  = ['PETROL','DIESEL','HYBRID','ELECTRIC'] as const
const TRANS_LIST       = ['AUTOMATIC','MANUAL'] as const
const CAR_TYPE_LIST    = ['NEW','USED','USED_QUALIFIED'] as const
const SORT_VALUES      = ['newest','price_asc','price_desc','year_desc','odometer_asc'] as const

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketClient({
  cars, total, page, pageSize, filtersData, currentFilters,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const locale   = useLocale()
  const t        = useTranslations('market')
  const [pending, startTransition] = useTransition()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const buildParams = useCallback(
    (overrides: Partial<Record<FilterKey, string | undefined>>) => {
      const params = new URLSearchParams()
      FILTER_KEYS.forEach((k) => {
        const val = k in overrides ? overrides[k] : (currentFilters[k] as string | undefined)
        if (val !== undefined && val !== '') params.set(k, String(val))
      })
      if (!('page' in overrides)) params.delete('page')
      return params.toString()
    },
    [currentFilters],
  )

  function go(overrides: Partial<Record<FilterKey, string | undefined>>) {
    startTransition(() => router.push(`${pathname}?${buildParams(overrides)}`))
  }

  function updateFilter(key: FilterKey, value: string | undefined) {
    go({ [key]: value })
  }

  function clearAll() {
    startTransition(() => router.push(pathname))
  }

  const activeCount = FILTER_KEYS.filter(
    (k) => k !== 'sort' && k !== 'page' && currentFilters[k],
  ).length

  const totalPages = Math.ceil(total / pageSize)

  const selectedBrand = filtersData.brands.find((b) => b.id === currentFilters.brandId)
  const categories    = selectedBrand?.categories ?? []
  const selectedCat   = categories.find((c) => c.id === currentFilters.categoryId)
  const models        = selectedCat?.models ?? []

  return (
    <div className="min-h-screen bg-[#F4F6F9]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div className="bg-[#0F3460] text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col gap-1 mb-5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-white/65 text-sm">
              {pending
                ? t('searching')
                : t('resultCount', { count: total.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US') })}
            </p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 start-3 pointer-events-none"
              />
              <input
                type="search"
                placeholder={t('searchPlaceholder')}
                defaultValue={(currentFilters.q as string) ?? ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    updateFilter('q', (e.target as HTMLInputElement).value || undefined)
                }}
                className="w-full rounded-[10px] bg-white text-gray-900 ps-9 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all shrink-0 ${
                activeCount > 0
                  ? 'bg-[#C9A84C] text-[#0F3460]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Filter size={15} />
              {t('filters')}
              {activeCount > 0 && (
                <span className="bg-white text-[#0F3460] rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center leading-none">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <ActiveChips
                currentFilters={currentFilters}
                filtersData={filtersData}
                t={t}
                locale={locale}
                onRemove={(key) => updateFilter(key as FilterKey, undefined)}
                onClearAll={clearAll}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-5">

          {/* ── Sidebar (desktop) ─────────────────────────────────── */}
          <aside className="shrink-0 w-64 hidden lg:block">
            <FilterPanel
              filtersData={filtersData}
              currentFilters={currentFilters}
              categories={categories}
              models={models}
              t={t}
              locale={locale}
              onUpdate={updateFilter}
              onClear={clearAll}
              activeCount={activeCount}
            />
          </aside>

          {/* ── Filter sheet (mobile) ─────────────────────────────── */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
              />
              <div
                className={`relative bg-white w-80 max-w-[90vw] h-full overflow-y-auto shadow-xl ${
                  locale === 'ar' ? 'me-auto' : 'ms-auto'
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                  <h2 className="font-bold text-[#0F3460]">{t('filters')}</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <FilterPanel
                    filtersData={filtersData}
                    currentFilters={currentFilters}
                    categories={categories}
                    models={models}
                    t={t}
                    locale={locale}
                    onUpdate={updateFilter}
                    onClear={clearAll}
                    activeCount={activeCount}
                    onDone={() => setSidebarOpen(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Sort + count bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 hidden sm:block">
                {total.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')} {t('cars')}
              </p>
              <SortSelect
                value={(currentFilters.sort as string) ?? 'newest'}
                t={t}
                onChange={(v) => updateFilter('sort', v)}
              />
            </div>

            {/* Grid */}
            {cars.length === 0 ? (
              <EmptyState t={t} onClear={clearAll} hasFilters={activeCount > 0} />
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200 ${
                  pending ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {cars.map((car) => (
                  <MarketCarCard key={car.id} car={car} locale={locale} t={t} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                t={t}
                locale={locale}
                onPage={(p) => go({ page: String(p) })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FilterPanel ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filtersData: FiltersData
  currentFilters: Record<string, string | number | undefined>
  categories: { id: string; nameAr: string; models: { id: string; name: string }[] }[]
  models: { id: string; name: string }[]
  t: ReturnType<typeof useTranslations<'market'>>
  locale: string
  onUpdate: (k: FilterKey, v: string | undefined) => void
  onClear: () => void
  activeCount: number
  onDone?: () => void
}

function FilterPanel({
  filtersData, currentFilters, categories, models, t, locale,
  onUpdate, onClear, activeCount, onDone,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-[14px] border border-gray-100 divide-y divide-gray-50 sticky top-4">

      {/* Brand / Category / Model cascade */}
      <FilterSection title={t('filter.brand')}>
        <FilterSelect
          value={(currentFilters.brandId as string) ?? ''}
          onChange={(v) => {
            onUpdate('brandId', v || undefined)
            onUpdate('categoryId', undefined)
            onUpdate('modelId', undefined)
          }}
          options={filtersData.brands.map((b) => ({
            value: b.id,
            label: locale === 'ar' ? b.nameAr : b.nameEn,
          }))}
          placeholder={t('all')}
        />
        {categories.length > 0 && (
          <FilterSelect
            className="mt-2"
            value={(currentFilters.categoryId as string) ?? ''}
            onChange={(v) => {
              onUpdate('categoryId', v || undefined)
              onUpdate('modelId', undefined)
            }}
            options={categories.map((c) => ({ value: c.id, label: c.nameAr }))}
            placeholder={t('filter.category')}
          />
        )}
        {models.length > 0 && (
          <FilterSelect
            className="mt-2"
            value={(currentFilters.modelId as string) ?? ''}
            onChange={(v) => onUpdate('modelId', v || undefined)}
            options={models.map((m) => ({ value: m.id, label: m.name }))}
            placeholder={t('filter.model')}
          />
        )}
      </FilterSection>

      {/* Body type chips */}
      <FilterSection title={t('filter.bodyType')}>
        <div className="flex flex-wrap gap-1.5">
          {BODY_TYPES.map((bt) => (
            <button
              key={bt}
              onClick={() =>
                onUpdate('bodyType', currentFilters.bodyType === bt ? undefined : bt)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                currentFilters.bodyType === bt
                  ? 'bg-[#0F3460] text-white border-[#0F3460]'
                  : 'border-gray-200 text-gray-600 hover:border-[#0F3460] hover:text-[#0F3460]'
              }`}
            >
              {t(`bodyType.${bt}`)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Year range */}
      <FilterSection title={t('filter.year')}>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="2015"
            defaultValue={(currentFilters.yearMin as number) ?? ''}
            onBlur={(e) => onUpdate('yearMin', e.target.value || undefined)}
            className="w-1/2 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F3460]"
          />
          <input
            type="number"
            placeholder="2025"
            defaultValue={(currentFilters.yearMax as number) ?? ''}
            onBlur={(e) => onUpdate('yearMax', e.target.value || undefined)}
            className="w-1/2 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F3460]"
          />
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title={`${t('filter.price')} (${t('sar')})`}>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="0"
            defaultValue={(currentFilters.priceMin as number) ?? ''}
            onBlur={(e) => onUpdate('priceMin', e.target.value || undefined)}
            className="w-1/2 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F3460]"
          />
          <input
            type="number"
            placeholder="500000"
            defaultValue={(currentFilters.priceMax as number) ?? ''}
            onBlur={(e) => onUpdate('priceMax', e.target.value || undefined)}
            className="w-1/2 border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F3460]"
          />
        </div>
      </FilterSection>

      {/* Fuel type */}
      <FilterSection title={t('filter.fuelType')}>
        <div className="flex flex-wrap gap-1.5">
          {FUEL_TYPES_LIST.map((ft) => (
            <button
              key={ft}
              onClick={() =>
                onUpdate('fuelType', currentFilters.fuelType === ft ? undefined : ft)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                currentFilters.fuelType === ft
                  ? 'bg-[#0F3460] text-white border-[#0F3460]'
                  : 'border-gray-200 text-gray-600 hover:border-[#0F3460] hover:text-[#0F3460]'
              }`}
            >
              {t(`fuel.${ft}`)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Transmission */}
      <FilterSection title={t('filter.transmission')}>
        <div className="flex gap-1.5">
          {TRANS_LIST.map((tr) => (
            <button
              key={tr}
              onClick={() =>
                onUpdate('transmission', currentFilters.transmission === tr ? undefined : tr)
              }
              className={`flex-1 py-1.5 rounded-[8px] text-xs font-medium border transition-all ${
                currentFilters.transmission === tr
                  ? 'bg-[#0F3460] text-white border-[#0F3460]'
                  : 'border-gray-200 text-gray-600 hover:border-[#0F3460] hover:text-[#0F3460]'
              }`}
            >
              {t(`transmission.${tr}`)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title={t('filter.condition')}>
        <div className="flex flex-wrap gap-1.5">
          {CAR_TYPE_LIST.map((ct) => (
            <button
              key={ct}
              onClick={() =>
                onUpdate('carType', currentFilters.carType === ct ? undefined : ct)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                currentFilters.carType === ct
                  ? 'bg-[#0F3460] text-white border-[#0F3460]'
                  : 'border-gray-200 text-gray-600 hover:border-[#0F3460] hover:text-[#0F3460]'
              }`}
            >
              {t(`carType.${ct}`)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* City */}
      <FilterSection title={t('filter.city')}>
        <FilterSelect
          value={(currentFilters.city as string) ?? ''}
          onChange={(v) => onUpdate('city', v || undefined)}
          options={filtersData.cities.map((c) => ({ value: c, label: c }))}
          placeholder={t('all')}
        />
      </FilterSection>

      {/* Clear + Done */}
      <div className="p-3 flex gap-2">
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-[8px] py-2 transition-all"
          >
            <X size={12} /> {t('clearAll')}
          </button>
        )}
        {onDone && (
          <button
            onClick={onDone}
            className="flex-1 bg-[#0F3460] text-white text-xs rounded-[8px] py-2 font-medium"
          >
            {t('showResults')}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── FilterSection ────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2"
      >
        {title}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && children}
    </div>
  )
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options, placeholder, className = '',
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0F3460] ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── ActiveChips ──────────────────────────────────────────────────────────────

function ActiveChips({
  currentFilters, filtersData, t, locale, onRemove, onClearAll,
}: {
  currentFilters: Record<string, string | number | undefined>
  filtersData: FiltersData
  t: ReturnType<typeof useTranslations<'market'>>
  locale: string
  onRemove: (key: string) => void
  onClearAll: () => void
}) {
  const chips: { key: string; label: string }[] = []

  if (currentFilters.brandId) {
    const b = filtersData.brands.find((x) => x.id === currentFilters.brandId)
    if (b) chips.push({ key: 'brandId', label: locale === 'ar' ? b.nameAr : b.nameEn })
  }
  if (currentFilters.categoryId) {
    const b = filtersData.brands.find((x) => x.id === currentFilters.brandId)
    const c = b?.categories.find((x) => x.id === currentFilters.categoryId)
    if (c) chips.push({ key: 'categoryId', label: c.nameAr })
  }
  if (currentFilters.yearMin || currentFilters.yearMax) {
    chips.push({
      key: 'yearMin',
      label: [currentFilters.yearMin, currentFilters.yearMax].filter(Boolean).join(' – '),
    })
  }
  if (currentFilters.priceMin || currentFilters.priceMax) {
    const toK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)
    chips.push({
      key: 'priceMin',
      label: `${[currentFilters.priceMin, currentFilters.priceMax]
        .filter(Boolean).map((v) => toK(Number(v))).join(' – ')} ${t('sar')}`,
    })
  }
  if (currentFilters.city)         chips.push({ key: 'city', label: String(currentFilters.city) })
  if (currentFilters.fuelType)     chips.push({ key: 'fuelType', label: t(`fuel.${currentFilters.fuelType}`) })
  if (currentFilters.transmission) chips.push({ key: 'transmission', label: t(`transmission.${currentFilters.transmission}`) })
  if (currentFilters.carType)      chips.push({ key: 'carType', label: t(`carType.${currentFilters.carType}`) })
  if (currentFilters.bodyType)     chips.push({ key: 'bodyType', label: t(`bodyType.${currentFilters.bodyType}`) })

  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onRemove(chip.key)}
          className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs px-2.5 py-1 rounded-full transition-all"
        >
          {chip.label}
          <X size={11} className="opacity-70" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-white/60 hover:text-white text-xs px-2 py-1 underline transition-all"
        >
          {t('clearAll')}
        </button>
      )}
    </>
  )
}

// ─── SortSelect ──────────────────────────────────────────────────────────────

function SortSelect({
  value, onChange, t,
}: {
  value: string
  onChange: (v: string) => void
  t: ReturnType<typeof useTranslations<'market'>>
}) {
  return (
    <div className="relative ms-auto">
      <SlidersHorizontal
        size={14}
        className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 pointer-events-none"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-gray-200 rounded-[8px] bg-white ps-8 pe-3 py-1.5 text-sm focus:outline-none focus:border-[#0F3460]"
      >
        {SORT_VALUES.map((v) => (
          <option key={v} value={v}>{t(`sort.${v}`)}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, t, locale, onPage,
}: {
  page: number
  totalPages: number
  t: ReturnType<typeof useTranslations<'market'>>
  locale: string
  onPage: (p: number) => void
}) {
  const delta = 2
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label={t('pagination')}>
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="p-2 rounded-[8px] border border-gray-200 bg-white text-gray-500 hover:text-[#0F3460] hover:border-[#0F3460] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {locale === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`w-9 h-9 rounded-[8px] text-sm font-medium border transition-all ${
              p === page
                ? 'bg-[#0F3460] text-white border-[#0F3460]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#0F3460] hover:text-[#0F3460]'
            }`}
          >
            {locale === 'ar' ? (p as number).toLocaleString('ar-SA') : p}
          </button>
        ),
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="p-2 rounded-[8px] border border-gray-200 bg-white text-gray-500 hover:text-[#0F3460] hover:border-[#0F3460] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {locale === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </nav>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  t, onClear, hasFilters,
}: {
  t: ReturnType<typeof useTranslations<'market'>>
  onClear: () => void
  hasFilters: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Car size={52} className="text-gray-200 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('empty.title')}</h3>
      <p className="text-sm text-gray-400 mb-5">{t('empty.body')}</p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-sm text-[#0F3460] border border-[#0F3460]/25 hover:bg-[#0F3460]/5 px-4 py-2 rounded-[8px] transition-all"
        >
          <X size={14} /> {t('clearAll')}
        </button>
      )}
    </div>
  )
}

// ─── MarketCarCard ────────────────────────────────────────────────────────────

function MarketCarCard({
  car, locale, t,
}: {
  car: MarketCar
  locale: string
  t: ReturnType<typeof useTranslations<'market'>>
}) {
  const price      = car.sellPrice ? Number(car.sellPrice) : null
  const coverUrl   = car.images[0]?.url
  const detailHref = `/${locale}/market/cars/${car.id}`
  const isAuction  = car.status === 'AUCTION'
  const isSoum     = car.displayMode === 'SOUM'

  function handleWhatsApp(e: React.MouseEvent) {
    e.preventDefault()
    const phone  = car.showroom.whatsapp?.replace(/\D/g, '') ?? ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const text   = encodeURIComponent(
      `${car.brand.nameAr} ${car.category.nameAr} ${car.year}\n` +
      (price ? `${t('price')}: ${formatPrice(price, locale)} ${t('sar')}\n` : '') +
      `${origin}${detailHref}`,
    )
    window.open(`https://wa.me/${phone ? `966${phone.replace(/^0/, '')}` : ''}?text=${text}`, '_blank')
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url    = `${origin}${detailHref}`
    if (navigator.share) {
      navigator.share({ title: `${car.brand.nameAr} ${car.category.nameAr} ${car.year}`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => alert(t('linkCopied'))).catch(() => {})
    }
  }

  return (
    <article className="group bg-white rounded-[14px] border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* Cover image */}
      <Link href={detailHref} className="block relative aspect-[16/11] overflow-hidden bg-gray-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${car.brand.nameAr} ${car.year}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Car size={36} className="text-gray-200" />
          </div>
        )}

        {/* Condition badge — top-start */}
        <span className={`
          absolute top-2 start-2 text-[10px] font-bold px-2 py-0.5 rounded-full
          ${car.carType === 'NEW'
            ? 'bg-emerald-500 text-white'
            : car.carType === 'USED_QUALIFIED'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700/80 text-white'}
        `}>
          {t(`carType.${car.carType}`)}
        </span>

        {/* Listing type badge — top-end */}
        {isAuction ? (
          <span className="absolute top-2 end-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Gavel size={9} /> {t('listingType.AUCTION')}
          </span>
        ) : isSoum ? (
          <span className="absolute top-2 end-2 flex items-center gap-1 bg-[#0F3460] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Tag size={9} /> {t('listingType.SOUM')}
          </span>
        ) : price ? (
          <span className="absolute top-2 end-2 flex items-center gap-1 bg-white/90 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Tag size={9} /> {t('listingType.FIXED')}
          </span>
        ) : null}
      </Link>

      {/* Body */}
      <div className="p-3">
        <Link href={detailHref}>
          <h3 className="font-bold text-[#0F3460] text-sm leading-snug hover:text-[#0d2d54]">
            {car.brand.nameAr} {car.category.nameAr} {car.year}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{car.model.name}</p>
        </Link>

        {/* Specs */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-400">
          {car.odometer !== null && car.odometer !== undefined && (
            <span className="flex items-center gap-0.5 ltr shrink-0">
              <Gauge size={11} className="shrink-0" />
              {car.odometer.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')} {t('km')}
            </span>
          )}
          {car.fuelType && (
            <span className="flex items-center gap-0.5 shrink-0">
              {car.fuelType === 'ELECTRIC' ? <Zap size={11} /> : <Fuel size={11} />}
              {t(`fuel.${car.fuelType}`)}
            </span>
          )}
          {car.showroom.city && (
            <span className="flex items-center gap-0.5 shrink-0">
              <MapPin size={11} /> {car.showroom.city}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2.5 min-h-[28px]">
          {price ? (
            <div className="flex items-baseline gap-1">
              <span className="price-number text-[18px] font-bold text-[#C9A84C] font-mono ltr">
                {formatPrice(price, locale)}
              </span>
              <span className="text-xs text-gray-400">{t('sar')}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">{t('priceOnRequest')}</span>
          )}
        </div>

        {/* Showroom */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-50">
          {car.showroom.logoUrl ? (
            <img
              src={car.showroom.logoUrl}
              className="w-5 h-5 rounded-full object-cover shrink-0"
              alt=""
            />
          ) : (
            <div className="w-5 h-5 bg-[#0F3460]/10 rounded-full flex items-center justify-center text-[8px] font-bold text-[#0F3460] shrink-0">
              {car.showroom.name[0]}
            </div>
          )}
          <span className="text-xs text-gray-500 truncate flex-1">{car.showroom.name}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1 bg-[#25D366] text-white text-xs py-2 rounded-[8px] hover:bg-[#1da855] transition-colors font-medium"
          >
            <MessageCircle size={13} />
            {t('whatsapp')}
          </button>
          <Link
            href={detailHref}
            className="flex-1 flex items-center justify-center text-xs py-2 rounded-[8px] bg-[#0F3460]/5 text-[#0F3460] hover:bg-[#0F3460]/10 transition-colors font-medium"
          >
            {t('viewDetails')}
          </Link>
          <button
            onClick={handleShare}
            aria-label={t('share')}
            className="px-2.5 py-2 border border-gray-200 rounded-[8px] text-gray-400 hover:text-[#0F3460] hover:border-[#0F3460]/30 transition-colors"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </article>
  )
}
