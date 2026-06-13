'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Gauge, Calendar, Fuel, MessageCircle, ImageOff, ArrowUpRight } from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber } from '@/lib/format'
import { buildWhatsappLink } from '@/lib/whatsapp'
import { ShareButton } from '@/components/ui/ShareButton'
import { cn } from '@/lib/utils'

export interface PublicCarData {
  id: string
  brandName: string
  categoryName: string
  year: number
  odometer: number | null
  fuelType: string | null
  sellPrice: number | null
  status: 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD' | 'DRAFT'
  coverImage: string | null
}

export function PublicCarCard({
  car,
  basePath,
  linkQuery = '',
  whatsapp,
  showPrices,
}: {
  car: PublicCarData
  basePath: string
  linkQuery?: string
  whatsapp: string | null
  showPrices: boolean
}) {
  const t  = useTranslations('car')
  const tc = useTranslations('common')
  const locale = useLocale()

  const href = `${basePath}/cars/${car.id}${linkQuery}`
  const wa   = buildWhatsappLink(whatsapp, `مرحباً، أرغب بالاستفسار عن ${car.brandName} ${car.categoryName} ${car.year}`)
  const isSold = car.status === 'SOLD'

  return (
    <div className={cn(
      'group relative bg-white rounded-2xl overflow-hidden border border-cl-gray-200',
      'hover:shadow-xl hover:border-cl-gray-400 transition-all duration-300',
      isSold && 'opacity-75'
    )}>
      {/* Image */}
      <a href={href} className="block relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
        {car.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.coverImage}
            alt={`${car.brandName} ${car.categoryName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-cl-gray-100 flex flex-col items-center justify-center gap-2">
            <ImageOff size={28} className="text-cl-gray-400" />
            <span className="text-xs text-cl-gray-400">لا توجد صورة</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Status badge */}
        <div className="absolute top-3 end-3">
          <StatusBadge status={car.status} />
        </div>

        {/* Quick view arrow */}
        <div className="absolute bottom-3 end-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
            <ArrowUpRight size={15} className="text-cl-primary" />
          </div>
        </div>
      </a>

      {/* Body */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-cl-text-primary text-sm mb-2 truncate">
          {car.brandName} {car.categoryName} {car.year}
        </h3>

        {/* Specs row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          {car.odometer != null && (
            <span className="flex items-center gap-1 text-xs text-cl-text-secondary">
              <Gauge size={12} className="text-cl-gray-400" />
              <span className="ltr">{formatNumber(car.odometer, locale)}</span> كم
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-cl-text-secondary">
            <Calendar size={12} className="text-cl-gray-400" />
            {car.year}
          </span>
          {car.fuelType && (
            <span className="flex items-center gap-1 text-xs text-cl-text-secondary">
              <Fuel size={12} className="text-cl-gray-400" />
              {safeFuel(car.fuelType, t)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-4 min-h-[28px]">
          {showPrices && car.sellPrice != null ? (
            <Price value={car.sellPrice} size="md" />
          ) : (
            <span className="text-sm text-cl-gray-400 italic">{tc('viewAll')}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={href}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cl-primary hover:bg-cl-primary-hover text-white text-xs font-semibold transition-colors"
          >
            {t('carDetails')}
          </a>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors shrink-0"
              title="WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
          )}
          <div className="shrink-0">
            <ShareButton
              carId={car.id}
              carTitle={`${car.brandName} ${car.categoryName} ${car.year}`}
              price={car.sellPrice != null ? String(car.sellPrice) : undefined}
              source="showroom"
              locale={locale}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function safeFuel(fuel: string, t: (k: string) => string): string {
  try { return t(`fuel.${fuel}`) } catch { return fuel }
}
