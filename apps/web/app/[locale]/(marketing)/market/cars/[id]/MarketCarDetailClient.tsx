'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Share2, MessageCircle, Phone,
  MapPin, Calendar, Gauge, Fuel, Settings2, Building2, ArrowRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'

type Car = {
  id: string
  year: number
  carType: string
  odometer: number | null
  fuelType: string | null
  transmission: string | null
  colorExt: string | null
  colorInt: string | null
  engineSize: string | null
  vin: string | null
  plateNumber: string | null
  sellPrice: unknown
  notes: string | null
  brand:    { nameAr: string; nameEn: string }
  category: { nameAr: string; bodyType: string }
  model:    { name: string }
  images:   { url: string; isCover: boolean }[]
  showroom: {
    id: string; name: string; slug: string | null; city: string | null
    logoUrl: string | null; whatsapp: string | null; phone: string | null
    instagramUrl: string | null; showroomNumber: number | null
  }
}

interface Props { car: Car; locale: string }

export default function MarketCarDetailClient({ car, locale }: Props) {
  const [activeImg, setActiveImg] = useState(0)
  const price = car.sellPrice ? Number(car.sellPrice) : null

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `${car.brand.nameAr} ${car.category.nameAr} ${car.year}`,
        url:   shareUrl,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => alert('تم نسخ الرابط ✓'))
    }
  }

  function whatsappUrl() {
    const phone = car.showroom.whatsapp?.replace(/\D/g, '') ?? ''
    const text  = encodeURIComponent(
      `مرحباً، أود الاستفسار عن:\n` +
      `${car.brand.nameAr} ${car.category.nameAr} ${car.year}\n` +
      (price ? `السعر: ${formatPrice(price, locale)} ريال\n` : '') +
      shareUrl
    )
    return `https://wa.me/966${phone.replace(/^0/, '')}?text=${text}`
  }

  const specs = [
    { label: 'السنة',      value: car.year,          icon: Calendar   },
    { label: 'الكيلومترات', value: car.odometer ? `${car.odometer.toLocaleString('ar-SA')} كم` : null, icon: Gauge },
    { label: 'نوع الوقود', value: { PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هجين', ELECTRIC: 'كهربائي' }[car.fuelType ?? ''] ?? car.fuelType, icon: Fuel },
    { label: 'ناقل الحركة', value: car.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : car.transmission === 'MANUAL' ? 'يدوي' : null, icon: Settings2 },
    { label: 'اللون الخارجي', value: car.colorExt, icon: null },
    { label: 'اللون الداخلي', value: car.colorInt, icon: null },
    { label: 'حجم المحرك', value: car.engineSize, icon: null },
    { label: 'المدينة',   value: car.showroom.city, icon: MapPin },
  ].filter((s) => s.value)

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href={`/${locale}/market`} className="hover:text-[#0F3460]">CarSell Live</Link>
          <ChevronLeft size={14} className="rotate-180" />
          <span className="text-gray-900">{car.brand.nameAr} {car.category.nameAr} {car.year}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main image */}
          <div className="relative bg-gray-100 rounded-[12px] overflow-hidden aspect-[16/9]">
            {car.images[activeImg] ? (
              <img
                src={car.images[activeImg].url}
                alt={`${car.brand.nameAr} ${car.year}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🚗</div>
            )}
            {/* Navigation arrows */}
            {car.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => (i - 1 + car.images.length) % car.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => setActiveImg((i) => (i + 1) % car.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {activeImg + 1} / {car.images.length || 1}
            </div>
          </div>

          {/* Thumbnails */}
          {car.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {car.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-12 rounded-[6px] overflow-hidden border-2 transition-all ${
                    i === activeImg ? 'border-[#C9A84C]' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Title + price */}
          <div className="bg-white rounded-[12px] border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F3460]">
                  {car.brand.nameAr} {car.category.nameAr} {car.year}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">{car.model.name}</p>
                {car.showroom.city && (
                  <p className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                    <MapPin size={12} /> {car.showroom.city}
                  </p>
                )}
              </div>
              <button onClick={handleShare} className="p-2 border border-gray-200 rounded-[8px] text-gray-400 hover:text-[#0F3460] hover:border-[#0F3460]">
                <Share2 size={18} />
              </button>
            </div>

            {price && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <span className="price-number text-3xl font-bold text-[#C9A84C] font-mono ltr">
                  {formatPrice(price, 'ar')}
                </span>
                <span className="text-gray-500 text-sm mr-2">ريال سعودي</span>
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="bg-white rounded-[12px] border border-gray-100 p-5">
            <h2 className="font-bold text-[#0F3460] mb-4">المواصفات</h2>
            <div className="grid grid-cols-2 gap-3">
              {specs.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 w-28">{s.label}</div>
                  <div className="text-sm font-medium text-gray-800">{String(s.value)}</div>
                </div>
              ))}
            </div>
            {car.vin && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                <span className="text-xs text-gray-400 w-28">رقم الهيكل (VIN)</span>
                <span className="vin text-sm font-mono text-gray-800 ltr">{car.vin}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {car.notes && (
            <div className="bg-white rounded-[12px] border border-gray-100 p-5">
              <h2 className="font-bold text-[#0F3460] mb-2">ملاحظات البائع</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{car.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Showroom card + CTA */}
        <div className="space-y-4">
          {/* Price card (mobile) */}
          {price && (
            <div className="lg:hidden bg-white rounded-[12px] border border-gray-100 p-4">
              <span className="price-number text-2xl font-bold text-[#C9A84C] font-mono ltr">
                {formatPrice(price, 'ar')}
              </span>
              <span className="text-gray-500 text-sm mr-1">ريال</span>
            </div>
          )}

          {/* CTA buttons */}
          <div className="bg-white rounded-[12px] border border-gray-100 p-5 space-y-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-[8px] font-semibold hover:bg-green-600 transition-colors w-full"
            >
              <MessageCircle size={18} />
              تواصل عبر واتساب
            </a>
            {car.showroom.phone && (
              <a
                href={`tel:${car.showroom.phone}`}
                className="flex items-center justify-center gap-2 border border-[#0F3460] text-[#0F3460] py-3 rounded-[8px] font-medium hover:bg-[#0F3460]/5 transition-colors w-full"
              >
                <Phone size={18} />
                اتصل بالمعرض
              </a>
            )}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 rounded-[8px] text-sm hover:bg-gray-50 transition-colors w-full"
            >
              <Share2 size={15} /> مشاركة السيارة
            </button>
          </div>

          {/* Showroom card */}
          <div className="bg-white rounded-[12px] border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              {car.showroom.logoUrl ? (
                <img src={car.showroom.logoUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-12 h-12 bg-[#0F3460]/10 rounded-full flex items-center justify-center">
                  <Building2 size={20} className="text-[#0F3460]" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-[#0F3460]">{car.showroom.name}</h3>
                {car.showroom.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} /> {car.showroom.city}
                  </p>
                )}
              </div>
            </div>

            {car.showroom.slug && (
              <Link
                href={`/${locale}/${car.showroom.slug}`}
                className="flex items-center justify-between text-sm text-[#0F3460] hover:text-[#C9A84C] transition-colors pt-3 border-t border-gray-50"
              >
                <span>عرض جميع سيارات المعرض</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
