'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Gauge, Calendar, Fuel, ImageOff } from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber, formatCarRef } from '@/lib/format'

export interface CarCardData {
  id: string
  carRefNumber: number
  carPublicId?: string | null
  brandName: string
  categoryName: string
  year: number
  odometer: number | null
  fuelType: string | null
  sellPrice: number | null
  status: 'DRAFT' | 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD'
  coverImage: string | null
}

export function CarCard({ car }: { car: CarCardData }) {
  const t = useTranslations('car.fuel')
  const locale = useLocale()
  const prefix = locale === 'ar' ? '' : '/en'

  return (
    <Link href={`${prefix}/inventory/${car.carPublicId ?? car.carRefNumber}`} className="cl-card !p-0 overflow-hidden block">
      <div className="relative aspect-[16/10] bg-cl-gray-100 flex items-center justify-center">
        {car.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={car.coverImage} alt={`${car.brandName} ${car.categoryName}`} className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={32} className="text-cl-gray-400" />
        )}
        <span className="absolute top-2 end-2">
          <StatusBadge status={car.status} />
        </span>
        <span className="absolute bottom-2 start-2 bg-black/50 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
          {car.carPublicId ?? `#${formatCarRef(car.carRefNumber)}`}
        </span>
      </div>

      <div className="p-4">
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

        <div className="mt-3">
          {car.sellPrice != null ? <Price value={car.sellPrice} size="md" /> : <span className="text-sm text-cl-gray-400">—</span>}
        </div>
      </div>
    </Link>
  )
}

function safeFuel(fuel: string, t: (k: string) => string): string {
  try {
    return t(fuel)
  } catch {
    return fuel
  }
}
