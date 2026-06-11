'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MessageCircle, Phone, Gauge, Fuel, Settings2, Calendar, ImageOff } from 'lucide-react'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SaudiPlate } from '@/components/features/cars/SaudiPlate'
import { parsePlateNumber, type SaudiPlateType } from '@/lib/saudi-plate'
import { formatNumber } from '@/lib/format'
import { buildWhatsappLink } from '@/lib/whatsapp'

export interface PublicCarDetailData {
  id: string
  brandName: string
  categoryName: string
  modelName: string
  year: number
  carType: 'NEW' | 'USED' | 'USED_QUALIFIED'
  status: 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD' | 'DRAFT'
  vin: string | null
  colorExt: string | null
  fuelType: string | null
  transmission: string | null
  odometer: number | null
  sellPrice: number | null
  plateNumber: string | null
  plateType: SaudiPlateType | null
  images: string[]
}

export function PublicCarDetail({
  car,
  whatsapp,
  phone,
  showPrices,
}: {
  car: PublicCarDetailData
  whatsapp: string | null
  phone: string | null
  showPrices: boolean
}) {
  const t = useTranslations('car')
  const tf = useTranslations('car.fields')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [active, setActive] = useState(0)
  const plate = parsePlateNumber(car.plateNumber)

  const wa = buildWhatsappLink(whatsapp, `مرحباً، أرغب بالاستفسار عن ${car.brandName} ${car.categoryName} ${car.year}`)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* Gallery */}
      <div className="space-y-3">
        <div className="aspect-[16/10] rounded-card overflow-hidden bg-cl-gray-100 flex items-center justify-center">
          {car.images[active] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={car.images[active]} alt={car.brandName} className="w-full h-full object-cover" />
          ) : (
            <ImageOff size={40} className="text-cl-gray-400" />
          )}
        </div>
        {car.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {car.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-16 w-24 shrink-0 rounded-input overflow-hidden border-2 ${i === active ? 'border-cl-primary' : 'border-transparent'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-4">
        <div className="cl-card space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-cl-primary">
              {car.brandName} {car.categoryName} {car.year}
            </h1>
            <StatusBadge status={car.status} />
          </div>

          {showPrices && car.sellPrice != null && <Price value={car.sellPrice} size="lg" />}

          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            {car.odometer != null && <Spec icon={Gauge} label={`${formatNumber(car.odometer, locale)} كم`} />}
            <Spec icon={Calendar} label={String(car.year)} />
            {car.fuelType && <Spec icon={Fuel} label={safe(t, `fuel.${car.fuelType}`)} />}
            {car.transmission && <Spec icon={Settings2} label={safe(t, `transmission.${car.transmission}`)} />}
          </div>

          <div className="pt-2 space-y-2 text-sm">
            <Row label={tf('model')} value={car.modelName} />
            <Row label={tf('carType')} value={safe(t, `type.${car.carType}`)} />
            <Row label={tf('color')} value={car.colorExt ?? '—'} />
            <Row label={tf('vin')} value={car.vin ?? '—'} mono />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="btn-gold flex-1 justify-center">
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="btn-secondary flex-1 justify-center">
                <Phone size={16} /> {tc('call')}
              </a>
            )}
          </div>
        </div>

        {car.plateNumber && (
          <div className="cl-card flex justify-center">
            <SaudiPlate letters={plate.letters} numbers={plate.numbers} type={car.plateType ?? 'PRIVATE'} size="md" />
          </div>
        )}
      </div>
    </div>
  )
}

function Spec({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-cl-gray-600">
      <Icon size={16} /> {label}
    </span>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-cl-gray-600">{label}</span>
      <span className={mono ? 'vin' : ''}>{value}</span>
    </div>
  )
}

function safe(t: (k: string) => string, key: string): string {
  try {
    return t(key)
  } catch {
    return key
  }
}
