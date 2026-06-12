'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  ChevronLeft, ChevronRight, Share2, MessageCircle, Phone,
  MapPin, Calendar, Gauge, Fuel, Settings2, Building2,
  CalendarClock, HandCoins, ShoppingCart, Zap, X, Car,
  ArrowRight, Tag, Gavel, ExternalLink, Instagram,
} from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { CarRequestModal } from '@/components/features/market/CarRequestModal'

// ─── Types ────────────────────────────────────────────────────────────────────

type CarWithDetails = {
  id: string
  year: number
  carType: string
  odometer: number | null
  fuelType: string | null
  transmission: string | null
  colorExt: string | null
  colorInt: string | null
  engineSize?: string | null
  vin: string | null
  plateNumber: string | null
  sellPrice: unknown
  status: string
  displayMode?: string | null
  notes: string | null
  brand:    { nameAr: string; nameEn: string }
  category: { nameAr: string; nameEn: string; bodyType: string }
  model:    { name: string }
  images:   { url: string; isCover: boolean }[]
  showroom: {
    id: string
    name: string
    slug: string | null
    city: string | null
    logoUrl: string | null
    whatsapp: string | null
    phone: string | null
    instagramUrl: string | null
    showroomNumber: number | null
  }
}

interface Props { car: CarWithDetails; locale: string }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketCarDetailClient({ car, locale }: Props) {
  const t          = useTranslations('market')
  const [activeImg, setActiveImg]   = useState(0)
  const [lightbox, setLightbox]     = useState(false)
  const [reqType, setReqType]       = useState<'RESERVATION' | 'SOUM_OFFER' | 'PURCHASE' | null>(null)

  const price     = car.sellPrice ? Number(car.sellPrice) : null
  const carTitle  = `${car.brand.nameAr} ${car.category.nameAr} ${car.year}`
  const isAuction = car.status === 'AUCTION'
  const isSoum    = car.displayMode === 'SOUM'

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightbox) return
    if (e.key === 'ArrowLeft')  setActiveImg((i) => (i + 1) % car.images.length)
    if (e.key === 'ArrowRight') setActiveImg((i) => (i - 1 + car.images.length) % car.images.length)
    if (e.key === 'Escape')     setLightbox(false)
  }, [lightbox, car.images.length])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: carTitle, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert(t('linkCopied')))
        .catch(() => {})
    }
  }

  function whatsappUrl() {
    const phone = car.showroom.whatsapp?.replace(/\D/g, '') ?? ''
    const text  = encodeURIComponent(
      `${t('whatsappGreeting')}\n${carTitle}\n` +
      (price ? `${t('price')}: ${formatPrice(price, locale)} ${t('sar')}\n` : '') +
      shareUrl,
    )
    return `https://wa.me/966${phone.replace(/^0/, '')}?text=${text}`
  }

  // ─ Specs grid ─────────────────────────────────────────────────────
  const specs: { label: string; value: string | number | null | undefined; mono?: boolean }[] = [
    { label: t('spec.year'),         value: car.year },
    { label: t('spec.odometer'),     value: car.odometer ? `${car.odometer.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')} ${t('km')}` : null, mono: true },
    { label: t('spec.fuelType'),     value: car.fuelType ? t(`fuel.${car.fuelType}`) : null },
    { label: t('spec.transmission'), value: car.transmission ? t(`transmission.${car.transmission}`) : null },
    { label: t('spec.bodyType'),     value: car.category.bodyType ? t(`bodyType.${car.category.bodyType}`) : null },
    { label: t('spec.colorExt'),     value: car.colorExt },
    { label: t('spec.colorInt'),     value: car.colorInt },
    { label: t('spec.engineSize'),   value: car.engineSize },
    { label: t('spec.condition'),    value: t(`carType.${car.carType}`) },
    { label: t('spec.city'),         value: car.showroom.city },
  ].filter((s) => s.value !== null && s.value !== undefined && s.value !== '')

  return (
    <div className="min-h-screen bg-[#F4F6F9]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href={`/${locale}/market`} className="hover:text-[#0F3460] transition-colors">
            {t('title')}
          </Link>
          {locale === 'ar' ? <ChevronLeft size={14} className="rotate-180" /> : <ChevronRight size={14} />}
          {car.brand.nameAr && (
            <>
              <Link href={`/${locale}/market?brandId=${encodeURIComponent(car.brand.nameAr)}`} className="hover:text-[#0F3460] transition-colors">
                {locale === 'ar' ? car.brand.nameAr : car.brand.nameEn}
              </Link>
              {locale === 'ar' ? <ChevronLeft size={14} className="rotate-180" /> : <ChevronRight size={14} />}
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{carTitle}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column: gallery + details ───────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Main image */}
          <div
            className="relative bg-gray-100 rounded-[14px] overflow-hidden aspect-[16/9] cursor-zoom-in"
            onClick={() => car.images.length > 0 && setLightbox(true)}
          >
            {car.images[activeImg] ? (
              <Image
                src={car.images[activeImg].url}
                alt={`${carTitle} — ${t('photo')} ${activeImg + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
                priority={activeImg === 0}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car size={56} className="text-gray-200" />
              </div>
            )}

            {/* Nav arrows */}
            {car.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImg((i) => (i - 1 + car.images.length) % car.images.length)
                  }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                  aria-label={t('prev')}
                >
                  {locale === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImg((i) => (i + 1) % car.images.length)
                  }}
                  className="absolute start-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                  aria-label={t('next')}
                >
                  {locale === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-3 end-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {activeImg + 1} / {car.images.length || 1}
            </div>

            {/* Share button overlay */}
            <button
              onClick={(e) => { e.stopPropagation(); handleShare() }}
              className="absolute top-3 end-3 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
              aria-label={t('share')}
            >
              <Share2 size={15} />
            </button>
          </div>

          {/* Thumbnails */}
          {car.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {car.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-12 rounded-[8px] overflow-hidden border-2 transition-all ${
                    i === activeImg ? 'border-[#C9A84C]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Title + price card */}
          <div className="bg-white rounded-[14px] border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Listing type badge */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {isAuction && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Gavel size={11} /> {t('listingType.AUCTION')}
                    </span>
                  )}
                  {isSoum && !isAuction && (
                    <span className="flex items-center gap-1 bg-[#0F3460]/10 text-[#0F3460] text-xs font-bold px-2.5 py-1 rounded-full">
                      <Tag size={11} /> {t('listingType.SOUM')}
                    </span>
                  )}
                  {!isAuction && !isSoum && (
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Tag size={11} /> {t('listingType.FIXED')}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-[#0F3460] leading-tight">{carTitle}</h1>
                <p className="text-gray-400 text-sm mt-0.5">{car.model.name}</p>
                {car.showroom.city && (
                  <p className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                    <MapPin size={12} /> {car.showroom.city}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            {price ? (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <span className="price-number text-3xl font-bold text-[#C9A84C] font-mono ltr">
                  {formatPrice(price, locale)}
                </span>
                <span className="text-gray-500 text-sm me-2"> {t('sar')}</span>
                {isSoum && (
                  <p className="text-xs text-gray-400 mt-1">{t('soumNote')}</p>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-sm text-gray-400 italic">{t('priceOnRequest')}</p>
              </div>
            )}
          </div>

          {/* Specs grid */}
          <div className="bg-white rounded-[14px] border border-gray-100 p-5">
            <h2 className="font-bold text-[#0F3460] mb-4">{t('specs')}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {specs.map((s) => (
                <div key={s.label} className="flex gap-2">
                  <span className="text-xs text-gray-400 shrink-0 w-28">{s.label}</span>
                  <span className={`text-sm font-medium text-gray-800 ${s.mono ? 'ltr font-mono' : ''}`}>
                    {String(s.value)}
                  </span>
                </div>
              ))}
            </div>

            {/* VIN */}
            {car.vin && (
              <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                <span className="text-xs text-gray-400 shrink-0 w-28">{t('spec.vin')}</span>
                <span className="vin text-sm font-mono text-gray-800 ltr">{car.vin}</span>
              </div>
            )}

            {/* Plate */}
            {car.plateNumber && (
              <div className="mt-2 flex gap-2">
                <span className="text-xs text-gray-400 shrink-0 w-28">{t('spec.plateNumber')}</span>
                <span className="plate-number text-sm font-mono text-gray-800 ltr">{car.plateNumber}</span>
              </div>
            )}
          </div>

          {/* Seller notes */}
          {car.notes && (
            <div className="bg-white rounded-[14px] border border-gray-100 p-5">
              <h2 className="font-bold text-[#0F3460] mb-2">{t('sellerNotes')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{car.notes}</p>
            </div>
          )}
        </div>

        {/* ── Right column: CTA + showroom ──────────────────────── */}
        <div className="space-y-4">

          {/* Sticky price (mobile — shown above CTAs on small screens) */}
          {price && (
            <div className="lg:hidden bg-white rounded-[14px] border border-gray-100 p-4 flex items-baseline gap-2">
              <span className="price-number text-2xl font-bold text-[#C9A84C] font-mono ltr">
                {formatPrice(price, locale)}
              </span>
              <span className="text-gray-500 text-sm">{t('sar')}</span>
            </div>
          )}

          {/* Request actions */}
          <div className="bg-white rounded-[14px] border border-gray-100 p-5 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {t('sendRequest')}
            </p>
            <button
              onClick={() => setReqType('RESERVATION')}
              className="flex items-center justify-center gap-2 bg-[#0F3460] text-white py-3 rounded-[10px] font-semibold hover:bg-[#0d2d54] transition-colors w-full"
            >
              <CalendarClock size={16} /> {t('reserve')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setReqType('SOUM_OFFER')}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[#C9A84C] text-[#C9A84C] py-2.5 rounded-[10px] font-medium hover:bg-[#C9A84C]/5 transition-colors text-sm"
              >
                <HandCoins size={15} /> {t('makeOffer')}
              </button>
              <button
                onClick={() => setReqType('PURCHASE')}
                className="flex-1 flex items-center justify-center gap-1.5 border border-[#0F3460] text-[#0F3460] py-2.5 rounded-[10px] font-medium hover:bg-[#0F3460]/5 transition-colors text-sm"
              >
                <ShoppingCart size={15} /> {t('buyRequest')}
              </button>
            </div>
          </div>

          {/* Contact buttons */}
          <div className="bg-white rounded-[14px] border border-gray-100 p-5 space-y-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-[10px] font-semibold hover:bg-[#1da855] transition-colors w-full"
            >
              <MessageCircle size={18} /> {t('contactWhatsapp')}
            </a>
            {car.showroom.phone && (
              <a
                href={`tel:${car.showroom.phone}`}
                className="flex items-center justify-center gap-2 border border-[#0F3460] text-[#0F3460] py-3 rounded-[10px] font-medium hover:bg-[#0F3460]/5 transition-colors w-full"
              >
                <Phone size={18} /> {t('callShowroom')}
              </a>
            )}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 border border-gray-200 text-gray-500 py-2.5 rounded-[10px] text-sm hover:bg-gray-50 transition-colors w-full"
            >
              <Share2 size={15} /> {t('share')}
            </button>
          </div>

          {/* Showroom card */}
          <div className="bg-white rounded-[14px] border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              {car.showroom.logoUrl ? (
                <img
                  src={car.showroom.logoUrl}
                  className="w-12 h-12 rounded-full object-cover border border-gray-100"
                  alt={car.showroom.name}
                />
              ) : (
                <div className="w-12 h-12 bg-[#0F3460]/10 rounded-full flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-[#0F3460]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#0F3460] truncate">{car.showroom.name}</h3>
                {car.showroom.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {car.showroom.city}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {car.showroom.slug && (
                <Link
                  href={`/${locale}/${car.showroom.slug}`}
                  className="flex items-center justify-between text-sm text-[#0F3460] hover:text-[#C9A84C] transition-colors py-2 border-t border-gray-50"
                >
                  <span>{t('viewShowroomCars')}</span>
                  <ArrowRight size={14} className={locale === 'ar' ? 'rotate-180' : ''} />
                </Link>
              )}
              {car.showroom.instagramUrl && (
                <a
                  href={car.showroom.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-pink-500 transition-colors py-2 border-t border-gray-50"
                >
                  <Instagram size={14} />
                  <span>Instagram</span>
                  <ExternalLink size={11} className="ms-auto opacity-50" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightbox && car.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 end-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            onClick={() => setLightbox(false)}
            aria-label={t('close')}
          >
            <X size={22} />
          </button>

          {/* Counter */}
          <p className="absolute top-5 start-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeImg + 1} / {car.images.length}
          </p>

          {/* Image */}
          <div
            className="relative w-full max-w-4xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={car.images[activeImg].url}
              alt={`${carTitle} — ${activeImg + 1}`}
              className="w-full h-full object-contain max-h-[80vh] rounded-[8px]"
            />
          </div>

          {/* Nav arrows */}
          {car.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveImg((i) => (i - 1 + car.images.length) % car.images.length)
                }}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                aria-label={t('prev')}
              >
                {locale === 'ar' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveImg((i) => (i + 1) % car.images.length)
                }}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
                aria-label={t('next')}
              >
                {locale === 'ar' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] pb-1">
            {car.images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveImg(i) }}
                className={`shrink-0 w-12 h-9 rounded-[4px] overflow-hidden border-2 transition-all ${
                  i === activeImg ? 'border-[#C9A84C]' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CarRequest modal */}
      {reqType && (
        <CarRequestModal
          carId={car.id}
          carTitle={carTitle}
          type={reqType}
          onClose={() => setReqType(null)}
        />
      )}
    </div>
  )
}
