'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Gauge, Calendar, Fuel, MessageCircle, ImageOff } from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber } from '@/lib/format'
import { buildWhatsappLink } from '@/lib/whatsapp'
import { ShareButton } from '@/components/ui/ShareButton'

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
  const t = useTranslations('car')
  const tc = useTranslations('common')
  const locale = useLocale()

  const href = `${basePath}/cars/${car.id}${linkQuery}`
  const wa = buildWhatsappLink(whatsapp, `مرحباً، أرغب بالاستفسار عن ${car.brandName} ${car.categoryName} ${car.year}`)

  return (
    <div className="cl-card !p-0 overflow-hidden flex flex-col">
      <a href={`${href}`} className="block relative aspect-[16/10] bg-cl-gray-100 flex items-center justify-center">
        {car.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={car.coverImage} alt={`${car.brandName} ${car.categoryName}`} className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={32} className="text-cl-gray-400" />
        )}
        <span className="absolute top-2 end-2">
          <StatusBadge status={car.status} />
        </span>
      </a>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-medium text-sm">
          {car.brandName} {car.categoryName} {car.year}
        </h3>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-cl-gray-600">
          {car.odometer != null && (
            <span className="flex items-center gap-1">
              <Gauge size={14} /> {formatNumber(car.odometer, locale)} كم
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {car.year}
          </span>
          {car.fuelType && (
            <span className="flex items-center gap-1">
              <Fuel size={14} /> {safeFuel(car.fuelType, t)}
            </span>
          )}
        </div>

        <div className="mt-3 mb-4">
          {showPrices && car.sellPrice != null ? (
            <Price value={car.sellPrice} size="md" />
          ) : (
            <span className="text-sm text-cl-gray-400">{tc('viewAll')}</span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="btn-gold !px-3 flex-1 justify-center">
              <MessageCircle size={16} />
            </a>
          )}
          <a href={`${href}`} className="btn-primary flex-1 justify-center">
            {t('carDetails')}
          </a>
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
  )
}

function safeFuel(fuel: string, t: (k: string) => string): string {
  try {
    return t(`fuel.${fuel}`)
  } catch {
    return fuel
  }
}
