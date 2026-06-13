'use client'

import Link from 'next/link'
import { formatPrice } from '@/lib/format'
import { Timer, ArrowLeft, ArrowRight, Search, Gavel, Car, Zap } from 'lucide-react'

const BODY_TYPES = [
  { key: 'SUV',         labelAr: 'SUV',        labelEn: 'SUV',         emoji: '🚙' },
  { key: 'SEDAN',       labelAr: 'سيدان',      labelEn: 'Sedan',       emoji: '🚗' },
  { key: 'PICKUP',      labelAr: 'بيك أب',     labelEn: 'Pickup',      emoji: '🛻' },
  { key: 'COUPE',       labelAr: 'كوبيه',      labelEn: 'Coupe',       emoji: '🏎' },
  { key: 'HATCHBACK',   labelAr: 'هاتشباك',    labelEn: 'Hatchback',   emoji: '🚘' },
  { key: 'VAN',         labelAr: 'فان',        labelEn: 'Van',         emoji: '🚐' },
  { key: 'CONVERTIBLE', labelAr: 'كشف',        labelEn: 'Convertible', emoji: '🏝' },
  { key: 'WAGON',       labelAr: 'ستيشن',      labelEn: 'Wagon',       emoji: '🚕' },
] as const

interface CarItem {
  id: string
  carRefNumber: number
  year: number
  carType: string
  odometer: number | null
  fuelType: string | null
  sellPrice: unknown
  status: string
  displayMode?: string | null
  auctionEndsAt?: Date | string | null
  brand:    { nameAr: string; nameEn: string }
  category: { nameAr: string; nameEn: string }
  model:    { name: string }
  images:   { url: string }[]
  showroom: { name: string; city: string | null; slug: string | null }
}

interface Brand {
  id: string
  nameAr: string
  nameEn: string
  logoUrl?: string | null
}

interface Props {
  newCars:     CarItem[]
  usedCars:    CarItem[]
  auctionCars: CarItem[]
  brands:      Brand[]
  locale:      string
}

export default function MarketHome({ newCars, usedCars, auctionCars, brands, locale }: Props) {
  const ar  = locale === 'ar'
  const dir = ar ? 'rtl' : 'ltr'
  const prefix = ar ? '' : '/en'

  function carUrl(car: CarItem) {
    return `/${locale}/market/cars/${car.carRefNumber}`
  }

  return (
    <div dir={dir} style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }} className="min-h-screen bg-gray-50">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="bg-[#0F3460] text-white px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href={`/${locale}/market`} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-[#C9A84C] flex items-center justify-center">
            <Car size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">CarSell Market</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          <Link href={`${prefix}/market?carType=NEW`}    className="px-3 py-1.5 rounded-[6px] hover:bg-white/10 transition-colors">{ar ? 'جديدة' : 'New'}</Link>
          <Link href={`${prefix}/market?carType=USED`}   className="px-3 py-1.5 rounded-[6px] hover:bg-white/10 transition-colors">{ar ? 'مستعملة' : 'Used'}</Link>
          <Link href={`${prefix}/market?status=AUCTION`} className="px-3 py-1.5 rounded-[6px] hover:bg-white/10 transition-colors flex items-center gap-1"><Gavel size={13} />{ar ? 'مزادات' : 'Auctions'}</Link>
          <Link href={`${prefix}/market`}                className="px-3 py-1.5 rounded-[6px] hover:bg-white/10 transition-colors">{ar ? 'كل السيارات' : 'All Cars'}</Link>
        </div>

        <Link href={`${prefix}/market`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-[8px] text-sm transition-colors">
          <Search size={13} />
          {ar ? 'بحث متقدم' : 'Search'}
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0F3460] to-[#1a4a7a] text-white px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap size={12} /> {ar ? 'سوق السيارات في السعودية والخليج' : 'Saudi & Gulf Car Marketplace'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {ar ? 'اعثر على سيارتك المثالية' : 'Find Your Perfect Car'}
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            {ar
              ? 'آلاف السيارات من معارض موثوقة في مكان واحد — جديدة، مستعملة، ومزادات مباشرة'
              : 'Thousands of cars from trusted showrooms in one place — new, used, and live auctions'}
          </p>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { label: ar ? 'كل السيارات' : 'All Cars',   href: `${prefix}/market` },
              { label: ar ? 'سيارات جديدة' : 'New Cars',  href: `${prefix}/market?carType=NEW` },
              { label: ar ? 'سيارات مستعملة' : 'Used',    href: `${prefix}/market?carType=USED` },
              { label: ar ? 'مزادات' : 'Auctions',        href: `${prefix}/market?status=AUCTION` },
            ].map((f) => (
              <Link key={f.href} href={f.href}
                className="px-5 py-2.5 rounded-full border border-white/30 text-sm font-medium hover:bg-white hover:text-[#0F3460] transition-all">
                {f.label}
              </Link>
            ))}
          </div>

          <Link href={`${prefix}/market`}
            className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold px-8 py-3.5 rounded-full text-base transition-colors">
            <Search size={16} />
            {ar ? 'ابدأ البحث' : 'Start Searching'}
          </Link>
        </div>
      </section>

      {/* ── Brand Logos Carousel ─────────────────────────────────────────── */}
      {brands.length > 0 && (
        <section className="bg-white border-b border-gray-100 py-6 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 text-center uppercase tracking-wider">
              {ar ? 'تصفح حسب الماركة' : 'Browse by Brand'}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center flex-wrap">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`${prefix}/market?brandId=${b.id}`}
                  className="flex flex-col items-center gap-1.5 min-w-[72px] group"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-gray-100 group-hover:border-[#0F3460] bg-gray-50 flex items-center justify-center overflow-hidden transition-colors">
                    {b.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logoUrl} alt={b.nameAr} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        {(ar ? b.nameAr : b.nameEn).slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-600 group-hover:text-[#0F3460] font-medium transition-colors text-center">
                    {ar ? b.nameAr : b.nameEn}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Body Type Filter ─────────────────────────────────────────────── */}
      <section className="bg-white py-5 px-4 md:px-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {BODY_TYPES.map((bt) => (
              <Link
                key={bt.key}
                href={`${prefix}/market?bodyType=${bt.key}`}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-[10px] border border-gray-200 hover:border-[#0F3460] hover:bg-[#0F3460]/5 transition-all min-w-[72px] group shrink-0"
              >
                <span className="text-xl">{bt.emoji}</span>
                <span className="text-[11px] font-medium text-gray-600 group-hover:text-[#0F3460]">
                  {ar ? bt.labelAr : bt.labelEn}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Auction Cars ─────────────────────────────────────────────────── */}
      {auctionCars.length > 0 && (
        <CarSection
          title={ar ? '🔴 مزادات مباشرة' : '🔴 Live Auctions'}
          subtitle={ar ? 'مزادات تنتهي قريباً — زايد الآن' : 'Ending soon — bid now'}
          cars={auctionCars}
          viewAllHref={`${prefix}/market?status=AUCTION`}
          viewAllLabel={ar ? 'كل المزادات' : 'All Auctions'}
          locale={locale}
          carUrl={carUrl}
          accent
        />
      )}

      {/* ── New Cars ─────────────────────────────────────────────────────── */}
      {newCars.length > 0 && (
        <CarSection
          title={ar ? '✨ سيارات جديدة' : '✨ New Cars'}
          subtitle={ar ? 'أحدث الموديلات من معارض معتمدة' : 'Latest models from certified showrooms'}
          cars={newCars}
          viewAllHref={`${prefix}/market?carType=NEW`}
          viewAllLabel={ar ? 'كل الجديدة' : 'All New Cars'}
          locale={locale}
          carUrl={carUrl}
        />
      )}

      {/* ── Used Cars ────────────────────────────────────────────────────── */}
      {usedCars.length > 0 && (
        <CarSection
          title={ar ? '🚗 سيارات مستعملة' : '🚗 Used Cars'}
          subtitle={ar ? 'سيارات مفحوصة بأسعار منافسة' : 'Inspected cars at competitive prices'}
          cars={usedCars}
          viewAllHref={`${prefix}/market?carType=USED`}
          viewAllLabel={ar ? 'كل المستعملة' : 'All Used Cars'}
          locale={locale}
          carUrl={carUrl}
        />
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0F3460] text-white/60 text-center text-xs py-6 mt-12">
        <p className="font-bold text-white text-sm mb-1">CarSell</p>
        <p>carsell.one — {ar ? 'سوق السيارات في السعودية والخليج' : 'Saudi & Gulf Car Marketplace'}</p>
      </footer>
    </div>
  )
}

// ── CarSection ────────────────────────────────────────────────────────────────

function CarSection({
  title, subtitle, cars, viewAllHref, viewAllLabel, locale, carUrl, accent,
}: {
  title:        string
  subtitle:     string
  cars:         CarItem[]
  viewAllHref:  string
  viewAllLabel: string
  locale:       string
  carUrl:       (c: CarItem) => string
  accent?:      boolean
}) {
  const ar = locale === 'ar'
  const Arrow = ar ? ArrowLeft : ArrowRight

  return (
    <section className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[#0F3460]">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="flex items-center gap-1 text-sm font-semibold text-[#C9A84C] hover:underline">
          {viewAllLabel} <Arrow size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cars.map((car) => (
          <MarketCarMiniCard key={car.id} car={car} locale={locale} href={carUrl(car)} accent={accent} />
        ))}
      </div>
    </section>
  )
}

// ── MarketCarMiniCard ─────────────────────────────────────────────────────────

function MarketCarMiniCard({ car, locale, href, accent }: { car: CarItem; locale: string; href: string; accent?: boolean }) {
  const ar    = locale === 'ar'
  const price = car.sellPrice ? Number(car.sellPrice) : null
  const cover = car.images[0]?.url
  const brand = ar ? car.brand.nameAr    : car.brand.nameEn
  const cat   = ar ? car.category.nameAr : car.category.nameEn

  return (
    <Link href={href} className="group bg-white rounded-[12px] border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all block">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`${brand} ${car.year}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Car size={28} />
          </div>
        )}
        {car.status === 'AUCTION' && (
          <div className="absolute top-2 start-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {ar ? 'مزاد' : 'Auction'}
          </div>
        )}
        {car.carType === 'NEW' && car.status !== 'AUCTION' && (
          <div className="absolute top-2 start-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {ar ? 'جديدة' : 'New'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="font-semibold text-sm text-[#0F3460] truncate">{brand} {cat}</p>
        <p className="text-xs text-gray-400 mt-0.5">{car.year} {car.showroom.city ? `· ${car.showroom.city}` : ''}</p>

        {/* Auction countdown */}
        {car.status === 'AUCTION' && car.auctionEndsAt && (
          <AuctionCountdown endsAt={new Date(car.auctionEndsAt)} ar={ar} />
        )}

        <div className="mt-2">
          {price ? (
            <p className={`price-number font-bold font-mono ltr text-sm ${accent ? 'text-red-600' : 'text-[#C9A84C]'}`}>
              {formatPrice(price, 'ar')} <span className="text-xs font-normal text-gray-400">{ar ? 'ر.س' : 'SAR'}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400">{ar ? 'اتصل للسعر' : 'Call for price'}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

function AuctionCountdown({ endsAt, ar }: { endsAt: Date; ar: boolean }) {
  const diff  = Math.max(0, endsAt.getTime() - Date.now())
  const hours = Math.floor(diff / 3_600_000)
  const mins  = Math.floor((diff % 3_600_000) / 60_000)

  if (diff <= 0) return <p className="text-xs text-red-500 mt-1">{ar ? 'انتهى المزاد' : 'Ended'}</p>

  return (
    <p className="text-[10px] text-red-500 font-mono mt-1 flex items-center gap-1">
      <Timer size={10} />
      {hours}h {mins}m {ar ? 'متبقي' : 'left'}
    </p>
  )
}
