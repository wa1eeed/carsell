'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, MapPin, Calendar, Gauge,
  Fuel, ChevronDown, X, Share2, MessageCircle, ArrowUpDown,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

type Car = {
  id: string
  carRefNumber: number
  year: number
  carType: string
  odometer: number | null
  fuelType: string | null
  transmission: string | null
  sellPrice: unknown
  plateNumber: string | null
  brand:    { nameAr: string; nameEn: string }
  category: { nameAr: string }
  model:    { name: string }
  images:   { url: string }[]
  showroom: { id: string; name: string; slug: string | null; city: string | null; logoUrl: string | null; whatsapp: string | null }
}

interface FiltersData {
  brands: { id: string; nameAr: string; nameEn: string; categories: { id: string; nameAr: string }[] }[]
  cities: string[]
}

interface Props {
  cars:           Car[]
  total:          number
  page:           number
  pageSize:       number
  filtersData:    FiltersData
  currentFilters: Record<string, string | number | undefined>
}

const SORT_OPTIONS = [
  { value: 'newest',    label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: الأقل' },
  { value: 'price_desc', label: 'السعر: الأعلى' },
  { value: 'year_desc', label: 'السنة: الأحدث' },
]

const CAR_TYPES  = [{ v: 'NEW', l: 'جديد' }, { v: 'USED', l: 'مستعمل' }, { v: 'USED_QUALIFIED', l: 'معتمد' }]
const FUEL_TYPES = [{ v: 'PETROL', l: 'بنزين' }, { v: 'DIESEL', l: 'ديزل' }, { v: 'HYBRID', l: 'هجين' }, { v: 'ELECTRIC', l: 'كهربائي' }]
const TRANS      = [{ v: 'AUTOMATIC', l: 'أوتوماتيك' }, { v: 'MANUAL', l: 'يدوي' }]

export default function MarketClient({ cars, total, page, pageSize, filtersData, currentFilters }: Props) {
  const router        = useRouter()
  const pathname      = usePathname()
  const locale        = useLocale()
  const [pending, startTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(false)

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    const keys = ['brandId','categoryId','yearMin','yearMax','priceMin','priceMax','city','carType','fuelType','transmission','q','sort']
    keys.forEach((k) => {
      const cur = k === key ? value : (currentFilters[k] as string | undefined)
      if (cur) params.set(k, String(cur))
    })
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function clearAll() {
    startTransition(() => router.push(pathname))
  }

  const activeFilters = Object.entries(currentFilters).filter(([k, v]) => v && k !== 'page').length

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Header */}
      <div className="bg-[#0F3460] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">CarSell Live</h1>
          <p className="text-white/70">سوق السيارات الخليجي — {total.toLocaleString('ar-SA')} سيارة متاحة</p>

          {/* Search bar */}
          <div className="mt-4 flex gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن ماركة، موديل، أو سنة..."
                defaultValue={(currentFilters.q as string) ?? ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateFilter('q', (e.target as HTMLInputElement).value || undefined)
                }}
                className="w-full bg-white text-gray-900 rounded-[8px] pr-9 pl-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all ${
                activeFilters > 0 ? 'bg-[#C9A84C] text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <SlidersHorizontal size={15} />
              فلاتر {activeFilters > 0 && `(${activeFilters})`}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter strip */}
        {showFilters && (
          <div className="bg-white rounded-[12px] border border-gray-100 p-4 mb-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Brand */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الماركة</label>
              <select
                value={(currentFilters.brandId as string) ?? ''}
                onChange={(e) => updateFilter('brandId', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              >
                <option value="">الكل</option>
                {filtersData.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.nameAr}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">المدينة</label>
              <select
                value={(currentFilters.city as string) ?? ''}
                onChange={(e) => updateFilter('city', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              >
                <option value="">الكل</option>
                {filtersData.cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Year range */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">السنة من</label>
              <input
                type="number" placeholder="2015"
                defaultValue={(currentFilters.yearMin as number) ?? ''}
                onBlur={(e) => updateFilter('yearMin', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">السنة إلى</label>
              <input
                type="number" placeholder="2024"
                defaultValue={(currentFilters.yearMax as number) ?? ''}
                onBlur={(e) => updateFilter('yearMax', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              />
            </div>

            {/* Car type */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الحالة</label>
              <select
                value={(currentFilters.carType as string) ?? ''}
                onChange={(e) => updateFilter('carType', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              >
                <option value="">الكل</option>
                {CAR_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>

            {/* Fuel */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">الوقود</label>
              <select
                value={(currentFilters.fuelType as string) ?? ''}
                onChange={(e) => updateFilter('fuelType', e.target.value || undefined)}
                className="w-full border border-gray-200 rounded-[8px] px-2 py-1.5 text-sm"
              >
                <option value="">الكل</option>
                {FUEL_TYPES.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>

            {/* Clear */}
            {activeFilters > 0 && (
              <div className="flex items-end">
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1.5 rounded-[6px] hover:bg-red-50"
                >
                  <X size={12} /> مسح الكل
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sort + count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {pending ? 'جارٍ البحث...' : `${total.toLocaleString('ar-SA')} سيارة`}
          </p>
          <select
            value={(currentFilters.sort as string) ?? 'newest'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-[8px] px-3 py-1.5 bg-white"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Cars grid */}
        {cars.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">لا توجد سيارات تطابق البحث</p>
            <button onClick={clearAll} className="mt-3 text-sm text-[#0F3460] hover:underline">مسح الفلاتر</button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${pending ? 'opacity-60' : ''}`}>
            {cars.map((car) => (
              <MarketCarCard key={car.id} car={car} locale={locale} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <button
                onClick={() => updateFilter('page', String(page - 1) as string)}
                className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm bg-white hover:bg-gray-50"
              >السابق</button>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              صفحة {page} من {Math.ceil(total / pageSize)}
            </span>
            {page < Math.ceil(total / pageSize) && (
              <button
                onClick={() => updateFilter('page', String(page + 1) as string)}
                className="px-4 py-2 border border-gray-200 rounded-[8px] text-sm bg-white hover:bg-gray-50"
              >التالي</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MarketCarCard({ car, locale }: { car: Car; locale: string }) {
  const price      = car.sellPrice ? Number(car.sellPrice) : null
  const coverImage = car.images[0]?.url
  const shareUrl   = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/market/cars/${car.id}`
    : `/ar/market/cars/${car.id}`

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `${car.brand.nameAr} ${car.category.nameAr} ${car.year}`,
        text:  price ? `السعر: ${formatPrice(price, locale)} ريال` : '',
        url:   shareUrl,
      }).catch(() => { /* user cancelled */ })
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('تم نسخ الرابط'))
        .catch(() => {})
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `${car.brand.nameAr} ${car.category.nameAr} ${car.year}\n` +
      (price ? `السعر: ${formatPrice(price, locale)} ريال\n` : '') +
      shareUrl
    )
    const phone = car.showroom.whatsapp?.replace(/\D/g, '')
    window.open(`https://wa.me/${phone ? `966${phone.replace(/^0/, '')}` : ''}?text=${text}`, '_blank')
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all group">
      {/* Image */}
      <Link href={`/${locale}/market/cars/${car.id}`} className="block relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={`${car.brand.nameAr} ${car.year}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🚗</span>
          </div>
        )}
        {/* Car type badge */}
        <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          car.carType === 'NEW' ? 'bg-green-500 text-white' :
          car.carType === 'USED_QUALIFIED' ? 'bg-blue-500 text-white' :
          'bg-gray-700 text-white'
        }`}>
          {car.carType === 'NEW' ? 'جديد' : car.carType === 'USED_QUALIFIED' ? 'معتمد' : 'مستعمل'}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        <Link href={`/${locale}/market/cars/${car.id}`}>
          <h3 className="font-bold text-[#0F3460] text-sm leading-tight">
            {car.brand.nameAr} {car.category.nameAr} {car.year}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{car.model.name}</p>
        </Link>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          {car.odometer && (
            <span className="flex items-center gap-0.5 ltr">
              <Gauge size={10} /> {car.odometer.toLocaleString('ar-SA')} كم
            </span>
          )}
          {car.fuelType && (
            <span className="flex items-center gap-0.5">
              <Fuel size={10} />
              {car.fuelType === 'PETROL' ? 'بنزين' : car.fuelType === 'HYBRID' ? 'هجين' : car.fuelType === 'ELECTRIC' ? 'كهربائي' : 'ديزل'}
            </span>
          )}
          {car.showroom.city && (
            <span className="flex items-center gap-0.5">
              <MapPin size={10} /> {car.showroom.city}
            </span>
          )}
        </div>

        {/* Price */}
        {price && (
          <div className="mt-2">
            <span className="price-number text-lg font-bold text-[#C9A84C] font-mono ltr">
              {formatPrice(price, 'ar')}
            </span>
            <span className="text-xs text-gray-400 mr-1">ريال</span>
          </div>
        )}

        {/* Showroom */}
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
          {car.showroom.logoUrl ? (
            <img src={car.showroom.logoUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-5 h-5 bg-[#0F3460]/10 rounded-full flex items-center justify-center text-[8px] font-bold text-[#0F3460]">
              {car.showroom.name[0]}
            </div>
          )}
          <span className="text-xs text-gray-500 truncate flex-1">{car.showroom.name}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white text-xs py-1.5 rounded-[6px] hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={12} /> واتساب
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 border border-gray-200 rounded-[6px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
