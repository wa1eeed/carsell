'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  RefreshCw, Send, Loader2, CheckCircle2, AlertTriangle, FileDown,
  Upload, ChevronDown, Receipt, Printer, Gavel, StopCircle,
  Fuel, Gauge, Palette, Hash, CalendarDays, Car, Settings2,
  Users, Banknote, Clock, TrendingUp, ChevronRight, Phone,
  FileText, Image as ImageIcon, Tag, ShieldCheck,
} from 'lucide-react'
import { SaudiPlate } from './SaudiPlate'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { calcNetProfit } from '@/lib/tax'
import { parsePlateNumber, type SaudiPlateType } from '@/lib/saudi-plate'
import { formatDateTime, formatCarRef } from '@/lib/format'
import { uploadFile } from '@/lib/upload-client'
import toast from 'react-hot-toast'
import { PublishModal } from './PublishModal'
import { ShareButton } from '@/components/ui/ShareButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export interface CarDetailData {
  id:             string
  carRefNumber:   number
  showroomSlug?:  string | null
  brandNameAr:    string
  brandNameEn:    string
  categoryNameAr: string
  categoryNameEn: string
  modelName:      string
  year:           number
  carType:        'NEW' | 'USED' | 'USED_QUALIFIED'
  bodyType:       string | null
  status:         'DRAFT' | 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD'
  displayMode:    'FIXED_PRICE' | 'SOUM' | 'AUCTION'
  listedOnMarket: boolean
  vin:            string | null
  colorExt:       string | null
  colorInt:       string | null
  fuelType:       string | null
  transmission:   string | null
  odometer:       number | null
  notes:          string | null
  purchasePrice:  number
  extraCosts:     number
  sellPrice:      number | null
  minAcceptedPrice: number | null
  plateNumber:    string | null
  plateType:      SaudiPlateType | null
  dataSource:     'MANUAL' | 'VDM_VIN' | 'VDM_ABSHER'
  engineSize:     string | null
  mojazReportUrl: string | null
  numberOfOwners: number | null
  // Auction
  auctionType:         string | null
  auctionSlug:         string | null
  auctionStartAt:      string | null
  auctionEndsAt:       string | null
  auctionOpeningPrice: number | null
  auctionBuyNowPrice:  number | null
  auctionDepositAmount: number | null
  auctionBidIncrement: number | null
  // Relations
  images:    { url: string; isCover: boolean }[]
  timeline:  { id: string; eventType: string; payload: Record<string, unknown>; userName: string; createdAt: string }[]
  documents: { id: string; docType: string; fileName: string; fileUrl: string }[]
  bids:      { id: string; amount: number; isWinning: boolean; bidderName: string; bidderNumber: number | null; createdAt: string }[]
  saumOffers: { id: string; buyerName: string; buyerPhone: string; offerAmount: number | null; status: string; dealerNote: string | null; createdAt: string }[]
}

type Tab = 'details' | 'financial' | 'timeline' | 'documents' | 'bids' | 'soum' | 'accidents' | 'mojaz'

export function CarDetail({ car }: { car: CarDetailData }) {
  const [publishOpen, setPublishOpen]   = useState(false)
  const [confirmAbsher, setConfirmAbsher] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [syncing, setSyncing]           = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)

  const t  = useTranslations('car')
  const tf = useTranslations('car.fields')
  const tc = useTranslations('common')
  const ta = useTranslations('actions')
  const ts = useTranslations('sale')
  const locale = useLocale()
  const ar     = locale === 'ar'
  const prefix = ar ? '' : '/en'

  const showVdmUpdate = car.dataSource === 'MANUAL' && car.vin != null
  const plate         = parsePlateNumber(car.plateNumber)
  const isPublished   = car.status === 'FOR_SALE' || car.status === 'AUCTION'
  const isAuction     = car.status === 'AUCTION'

  // Default tab — show bids if auction, soum if soum mode
  const defaultTab: Tab = isAuction ? 'bids' : car.displayMode === 'SOUM' ? 'soum' : 'details'
  const [tab, setTab] = useState<Tab>(defaultTab)

  const brandName    = ar ? car.brandNameAr    : car.brandNameEn
  const categoryName = ar ? car.categoryNameAr : car.categoryNameEn

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'details',   label: t('carDetails') },
    { key: 'financial', label: t('financial') },
    ...(isAuction ? [{ key: 'bids' as Tab, label: 'سجل المزايدات', badge: car.bids.length }] : []),
    ...(car.displayMode === 'SOUM' ? [{ key: 'soum' as Tab, label: 'سجل المساومات', badge: car.saumOffers.length }] : []),
    { key: 'timeline',  label: t('timeline'),   badge: car.timeline.length },
    { key: 'documents', label: t('documents'),  badge: car.documents.length },
    { key: 'accidents', label: t('accidents') },
    { key: 'mojaz',     label: t('mojazReport') },
  ]

  async function updateFromAbsher() {
    setSyncing(true)
    try {
      const res  = await fetch(`/api/v1/cars/${car.id}/vdm-sync`, { method: 'POST' })
      const json = await res.json() as { success?: boolean; error?: { message?: string } }
      if (json.success) {
        toast.success('تم تحديث البيانات من أبشر بنجاح')
        window.location.reload()
      } else {
        toast.error(json.error?.message ?? tc('error'))
      }
    } catch { toast.error(tc('error')) }
    finally  { setSyncing(false) }
  }

  async function unpublish() {
    setUnpublishing(true)
    try {
      const res = await fetch(`/api/v1/cars/${car.id}/unpublish`, { method: 'POST' })
      if (res.ok) {
        toast.success('تم إيقاف الإعلان')
        window.location.reload()
      } else {
        toast.error('فشل إيقاف الإعلان')
      }
    } catch { toast.error(tc('error')) }
    finally  { setUnpublishing(false) }
  }

  const coverImage = car.images.find((i) => i.isCover)?.url ?? car.images[0]?.url ?? null

  return (
    <div className="space-y-5" dir={ar ? 'rtl' : 'ltr'}>

      {/* ── Hero header ── */}
      <div className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">
        {/* Cover strip */}
        <div className="relative h-48 bg-gradient-to-br from-[#0F3460] to-[#0A2540] overflow-hidden">
          {coverImage && (
            <img src={coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Published badge */}
          {isPublished && (
            <div className={`absolute top-3 ${ar ? 'right-3' : 'left-3'} flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isAuction ? 'bg-purple-500 text-white' : 'bg-green-500 text-white'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {isAuction ? 'معروض في المزاد' : 'منشور للبيع'}
            </div>
          )}

          {/* Car ref ID */}
          <div className={`absolute top-3 ${ar ? 'left-3' : 'right-3'} bg-black/40 text-white text-xs font-mono px-2.5 py-1 rounded-full`}>
            #{formatCarRef(car.carRefNumber)}
          </div>

          {/* Title overlay */}
          <div className={`absolute bottom-4 ${ar ? 'right-4' : 'left-4'}`}>
            <h1 className="text-xl font-bold text-white">
              {brandName} {categoryName} {car.modelName} {car.year}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={car.status} />
              {car.sellPrice && (
                <span className="price-number text-[#C9A84C] font-mono font-bold text-sm ltr">
                  {car.sellPrice.toLocaleString('en-US')} <span className="text-white/70 font-normal not-italic">ر.س</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {car.images.length > 1 && (
          <div className="flex gap-1.5 p-3 overflow-x-auto bg-gray-50">
            {car.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                className={`h-14 w-20 object-cover rounded-[6px] shrink-0 ${img.isCover ? 'ring-2 ring-[#C9A84C]' : ''}`}
                alt=""
              />
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-50">
          {showVdmUpdate && (
            <button className="btn-secondary" onClick={() => setConfirmAbsher(true)} disabled={syncing}>
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {ta('updateFromAbsher')}
            </button>
          )}

          <a href={`${prefix}/inventory/${car.carRefNumber}/print`} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1.5 text-sm">
            <Printer size={14} /> {ar ? 'ورقة السيارة' : 'Print Slip'}
          </a>

          <ShareButton
            carId={String(car.carRefNumber)}
            carTitle={`${brandName} ${categoryName} ${car.year}`}
            price={car.sellPrice ? String(car.sellPrice) : undefined}
            showroomSlug={car.showroomSlug}
            source="dashboard"
            locale={locale}
          />

          {car.status !== 'SOLD' && car.status !== 'DRAFT' && (
            <a className="btn-primary flex items-center gap-1.5 text-sm" href={`${prefix}/sales/new/${car.id}`}>
              <Receipt size={14} /> {ts('registerSale')}
            </a>
          )}

          {/* Smart publish/unpublish toggle */}
          {car.status !== 'SOLD' && !isPublished && (
            <button className="btn-gold flex items-center gap-1.5 text-sm" onClick={() => setPublishOpen(true)}>
              <Send size={14} /> {t('publishForSale')}
            </button>
          )}
          {isPublished && (
            <button
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-[8px] border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => setConfirmUnpublish(true)}
              disabled={unpublishing}
            >
              {unpublishing ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
              {isAuction ? 'إيقاف المزاد' : 'إيقاف الإعلان'}
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
                tab === tb.key
                  ? 'border-[#C9A84C] text-[#0F3460]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tb.label}
              {tb.badge !== undefined && tb.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === tb.key ? 'bg-[#0F3460] text-white' : 'bg-gray-100 text-gray-500'
                }`}>{tb.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'details'   && <DetailsTab   car={car} plate={plate} t={t} tf={tf} ar={ar} />}
          {tab === 'financial' && <FinancialTab  car={car} tf={tf} />}
          {tab === 'bids'      && <BidsTab       bids={car.bids} bidIncrement={car.auctionBidIncrement} openingPrice={car.auctionOpeningPrice} endsAt={car.auctionEndsAt} locale={locale} />}
          {tab === 'soum'      && <SaumTab       offers={car.saumOffers} minAccepted={car.minAcceptedPrice} locale={locale} />}
          {tab === 'timeline'  && <TimelineTab   timeline={car.timeline} locale={locale} tc={tc} />}
          {tab === 'documents' && <DocumentsTab  car={car} tc={tc} />}
          {tab === 'accidents' && <AccidentsTab  carId={car.id} t={t} tc={tc} />}
          {tab === 'mojaz'     && <MojazTab      car={car} t={t} tc={tc} ta={ta} />}
        </div>
      </div>

      {publishOpen && (
        <PublishModal carId={car.id} onClose={() => setPublishOpen(false)} showroomSlug={car.showroomSlug} />
      )}

      <ConfirmDialog
        open={confirmAbsher}
        title="تحديث البيانات من أبشر"
        message="سيتم تحديث بيانات السيارة من نظام أبشر — هل تريد المتابعة؟"
        confirmLabel="تحديث" cancelLabel="إلغاء" variant="warning"
        onConfirm={() => { setConfirmAbsher(false); updateFromAbsher() }}
        onCancel={() => setConfirmAbsher(false)}
      />
      <ConfirmDialog
        open={confirmUnpublish}
        title={isAuction ? 'إيقاف المزاد' : 'إيقاف الإعلان'}
        message="ستختفي السيارة من الماركت وتعود لحالة المسودة — هل تريد المتابعة؟"
        confirmLabel="إيقاف" cancelLabel="تراجع" variant="danger"
        onConfirm={() => { setConfirmUnpublish(false); unpublish() }}
        onCancel={() => setConfirmUnpublish(false)}
      />
    </div>
  )
}

// ── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  car, plate, t, tf, ar,
}: {
  car: CarDetailData
  plate: { letters: string[]; numbers: string }
  t: (k: string) => string
  tf: (k: string) => string
  ar: boolean
}) {
  const specs = [
    { icon: Car,       label: tf('model'),        value: car.modelName },
    { icon: Tag,       label: tf('carType'),       value: t(`type.${car.carType}`) },
    { icon: Fuel,      label: tf('fuelType'),      value: car.fuelType ? t(`fuel.${car.fuelType}`) : '—' },
    { icon: Settings2, label: tf('transmission'),  value: car.transmission ? t(`transmission.${car.transmission}`) : '—' },
    { icon: Gauge,     label: tf('odometer'),      value: car.odometer != null ? `${car.odometer.toLocaleString()} كم` : '—', mono: true },
    { icon: Palette,   label: tf('color'),         value: car.colorExt ?? '—' },
    { icon: Palette,   label: tf('colorInt'),      value: car.colorInt ?? '—' },
    { icon: Hash,      label: tf('vin'),           value: car.vin ?? '—', mono: true },
    ...(car.engineSize ? [{ icon: Settings2, label: 'سعة المحرك', value: car.engineSize }] : []),
    ...(car.numberOfOwners != null ? [{ icon: Users, label: 'عدد الملاك', value: String(car.numberOfOwners) }] : []),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Specs */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[#0F3460] mb-3">المواصفات</h3>
        <div className="divide-y divide-gray-50">
          {specs.map(({ icon: Icon, label, value, mono }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon size={14} className="text-gray-300 shrink-0" />
                <span>{label}</span>
              </div>
              <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono ltr' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
        {car.notes && (
          <div className="mt-3 p-3 bg-amber-50 rounded-[8px] text-sm text-amber-800">
            <span className="font-medium">ملاحظات: </span>{car.notes}
          </div>
        )}
      </div>

      {/* Plate + Auction info */}
      <div className="space-y-4">
        {car.plateNumber && (
          <div>
            <h3 className="text-sm font-bold text-[#0F3460] mb-3">لوحة السيارة</h3>
            <SaudiPlate letters={plate.letters} numbers={plate.numbers} type={car.plateType ?? 'PRIVATE'} size="lg" />
          </div>
        )}

        {/* Auction details card */}
        {car.status === 'AUCTION' && car.auctionEndsAt && (
          <div className="bg-purple-50 border border-purple-100 rounded-[10px] p-4 space-y-2">
            <h3 className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
              <Gavel size={14} /> تفاصيل المزاد
            </h3>
            <SpecRow label="سعر الافتتاح"      value={car.auctionOpeningPrice ? `${car.auctionOpeningPrice.toLocaleString()} ر.س` : '—'} />
            {car.auctionBuyNowPrice && <SpecRow label="شراء فوري"         value={`${car.auctionBuyNowPrice.toLocaleString()} ر.س`} />}
            {car.auctionBidIncrement && <SpecRow label="الحد الأدنى للمزايدة" value={`${car.auctionBidIncrement.toLocaleString()} ر.س`} />}
            {car.auctionDepositAmount && <SpecRow label="التأمين"           value={`${car.auctionDepositAmount.toLocaleString()} ر.س`} />}
            <SpecRow label="ينتهي في" value={new Date(car.auctionEndsAt).toLocaleString(ar ? 'ar-SA' : 'en-US')} />
            {car.bids.length > 0 && (
              <SpecRow label="أعلى مزايدة" value={`${Math.max(...car.bids.map((b) => b.amount)).toLocaleString()} ر.س`} highlight />
            )}
          </div>
        )}

        {/* Soum details */}
        {car.displayMode === 'SOUM' && car.sellPrice && (
          <div className="bg-amber-50 border border-amber-100 rounded-[10px] p-4 space-y-2">
            <h3 className="text-sm font-bold text-amber-700">تفاصيل السوم</h3>
            <SpecRow label="السعر المعروض"    value={`${car.sellPrice.toLocaleString()} ر.س`} />
            {car.minAcceptedPrice && <SpecRow label="أدنى سعر مقبول" value={`${car.minAcceptedPrice.toLocaleString()} ر.س`} />}
            <SpecRow label="عدد العروض"       value={String(car.saumOffers.length)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Financial Tab ────────────────────────────────────────────────────────────

function FinancialTab({ car, tf }: { car: CarDetailData; tf: (k: string) => string }) {
  const p = calcNetProfit({
    carType:       car.carType,
    sellPrice:     car.sellPrice ?? 0,
    purchasePrice: car.purchasePrice,
    extraCosts:    car.extraCosts,
  })
  return (
    <div className="max-w-md">
      <h3 className="text-sm font-bold text-[#0F3460] mb-4">التفاصيل المالية</h3>
      <div className="bg-gray-50 rounded-[10px] p-4 space-y-2.5">
        <FinRow label={tf('purchasePrice')} value={car.purchasePrice} />
        <FinRow label="تكاليف إضافية"      value={car.extraCosts} />
        <FinRow label="إجمالي التكلفة"     value={p.totalCost}  bold />
        <div className="border-t border-gray-200 my-2" />
        <FinRow label={tf('sellPrice')}     value={car.sellPrice ?? 0} />
        <FinRow label="ضريبة القيمة المضافة (15%)" value={p.vatAmount} />
        <div className="border-t border-gray-200 my-2" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">صافي الربح</span>
          <span className={`price-number font-bold text-lg ltr ${p.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {p.netProfit >= 0 ? '+' : ''}{p.netProfit.toLocaleString()} ر.س
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Bids Tab (Auction) ───────────────────────────────────────────────────────

function BidsTab({
  bids, bidIncrement, openingPrice, endsAt, locale,
}: {
  bids: CarDetailData['bids']
  bidIncrement: number | null
  openingPrice: number | null
  endsAt: string | null
  locale: string
}) {
  const ar = locale === 'ar'
  const topBid = bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : null
  const ended  = endsAt ? new Date(endsAt) < new Date() : false

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 rounded-[10px] p-3 text-center">
          <div className="text-lg font-bold text-purple-700 price-number ltr">{bids.length}</div>
          <div className="text-xs text-purple-500 mt-0.5">عدد المزايدات</div>
        </div>
        <div className="bg-green-50 rounded-[10px] p-3 text-center">
          <div className="text-lg font-bold text-green-700 price-number ltr">
            {topBid ? topBid.toLocaleString('en-US') : '—'}
          </div>
          <div className="text-xs text-green-500 mt-0.5">أعلى مزايدة</div>
        </div>
        <div className={`${ended ? 'bg-red-50' : 'bg-amber-50'} rounded-[10px] p-3 text-center`}>
          <div className={`text-sm font-bold ${ended ? 'text-red-600' : 'text-amber-700'}`}>
            {endsAt ? (ended ? 'انتهى' : new Date(endsAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US')) : '—'}
          </div>
          <div className={`text-xs mt-0.5 ${ended ? 'text-red-400' : 'text-amber-500'}`}>تاريخ الانتهاء</div>
        </div>
      </div>

      {bidIncrement && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-[6px] px-3 py-1.5">
          الحد الأدنى لكل مزايدة: <span className="font-mono font-medium text-[#0F3460]">{bidIncrement.toLocaleString()} ر.س</span>
        </div>
      )}

      {/* Bid list */}
      {bids.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          <Gavel size={28} className="mx-auto mb-2 text-gray-200" />
          لا توجد مزايدات بعد
        </div>
      ) : (
        <div className="space-y-2">
          {bids.map((b, i) => (
            <div key={b.id} className={`flex items-center gap-3 p-3 rounded-[8px] border ${b.isWinning ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-[#C9A84C] text-white' : 'bg-gray-100 text-gray-500'
              }`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{b.bidderName}</span>
                  {b.bidderNumber && <span className="text-xs text-gray-400 font-mono ltr">#{b.bidderNumber}</span>}
                  {b.isWinning && <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">فائز</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={10} /> {formatDateTime(b.createdAt, locale)}
                </div>
              </div>
              <span className="price-number font-bold text-[#C9A84C] font-mono ltr shrink-0">
                {b.amount.toLocaleString('en-US')} ر.س
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Soum Tab ─────────────────────────────────────────────────────────────────

function SaumTab({
  offers, minAccepted, locale,
}: {
  offers: CarDetailData['saumOffers']
  minAccepted: number | null
  locale: string
}) {
  const SOUM_STATUS: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: 'قيد الانتظار', cls: 'bg-amber-50 text-amber-600' },
    RESERVED: { label: 'مقبول',        cls: 'bg-green-50 text-green-600' },
    REJECTED: { label: 'مرفوض',        cls: 'bg-red-50 text-red-500' },
    CANCELLED:{ label: 'ملغي',         cls: 'bg-gray-100 text-gray-400' },
    COMPLETED:{ label: 'مكتمل',        cls: 'bg-blue-50 text-blue-600' },
  }

  const accepted = offers.find((o) => o.status === 'RESERVED' || o.status === 'COMPLETED')

  return (
    <div className="space-y-4">
      {minAccepted && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-[6px] px-3 py-1.5">
          الحد الأدنى المقبول (سري): <span className="font-mono font-medium text-[#0F3460]">{minAccepted.toLocaleString()} ر.س</span>
        </div>
      )}
      {accepted && (
        <div className="bg-green-50 border border-green-100 rounded-[10px] p-3 flex items-center gap-3">
          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-green-700">السومة المقبولة: </span>
            <span className="price-number font-mono text-green-800 ltr">{accepted.offerAmount?.toLocaleString('en-US')} ر.س</span>
            <span className="text-gray-500 mr-2">— {accepted.buyerName}</span>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          <Banknote size={28} className="mx-auto mb-2 text-gray-200" />
          لا توجد عروض بعد
        </div>
      ) : (
        <div className="space-y-2">
          {offers.map((o) => {
            const badge = SOUM_STATUS[o.status] ?? SOUM_STATUS.PENDING
            return (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-[8px] border border-gray-100 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{o.buyerName}</span>
                    <a href={`tel:${o.buyerPhone}`} className="text-xs text-[#0F3460] font-mono ltr flex items-center gap-0.5 hover:underline">
                      <Phone size={10} /> {o.buyerPhone}
                    </a>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {formatDateTime(o.createdAt, locale)}
                  </div>
                  {o.dealerNote && (
                    <div className="text-xs text-blue-600 mt-1">ملاحظة: {o.dealerNote}</div>
                  )}
                </div>
                <span className={`price-number font-bold font-mono ltr shrink-0 ${o.status === 'RESERVED' || o.status === 'COMPLETED' ? 'text-green-600' : 'text-[#C9A84C]'}`}>
                  {o.offerAmount ? `${o.offerAmount.toLocaleString('en-US')} ر.س` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Timeline Tab ─────────────────────────────────────────────────────────────

const CAR_STATUS_AR: Record<string, string> = {
  DRAFT: 'مسودة', FOR_SALE: 'معروضة للبيع', RESERVED: 'محجوزة', AUCTION: 'مزاد', SOLD: 'مباعة',
}
const REQUEST_STATUS_AR: Record<string, string> = {
  RESERVED: 'محجوزة', WAITING_PAYMENT: 'انتظار الدفع',
  OWNERSHIP_TRANSFER: 'نقل الملكية', COMPLETED: 'مكتملة',
  REJECTED: 'مرفوضة', CANCELLED: 'ملغاة',
}
const DISPLAY_MODE_AR: Record<string, string> = {
  FIXED_PRICE: 'سعر ثابت', SOUM: 'سوم', AUCTION: 'مزاد',
}

function timelineLabel(eventType: string, payload: Record<string, unknown>): string {
  switch (eventType) {
    case 'CAR_CREATED':    return 'تم إنشاء السيارة'
    case 'FIELD_UPDATED':  return `تحديث حقل: ${String(payload.field ?? '')}`
    case 'PRICE_CHANGED':  return `تغيير السعر → ${String(payload.to ?? '')} ريال`
    case 'NOTE_ADDED':     return 'إضافة ملاحظة'
    case 'FILE_UPLOADED':  return `رفع ملف: ${String(payload.fileName ?? '')}`
    case 'FILE_DELETED':   return 'حذف ملف'
    case 'SALE_REGISTERED': return 'تسجيل بيع'
    case 'STATUS_CHANGED': {
      const to        = String(payload.to ?? '')
      const mode      = payload.displayMode ? ` (${DISPLAY_MODE_AR[String(payload.displayMode)] ?? payload.displayMode})` : ''
      const reqStatus = String(payload.requestStatus ?? '')
      if (payload.displayMode) return `نشر السيارة${mode} — ${CAR_STATUS_AR[to] ?? to}`
      if (reqStatus) {
        const buyer = payload.buyerName ? ` · ${String(payload.buyerName)}` : ''
        return `${REQUEST_STATUS_AR[reqStatus] ?? reqStatus}${buyer} — السيارة: ${CAR_STATUS_AR[to] ?? to}`
      }
      const from = CAR_STATUS_AR[String(payload.from ?? '')] ?? String(payload.from ?? '')
      return `تغيير الحالة: ${from} ← ${CAR_STATUS_AR[to] ?? to}`
    }
    default: return eventType
  }
}

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  CAR_CREATED:     <Car size={12} />,
  STATUS_CHANGED:  <Tag size={12} />,
  PRICE_CHANGED:   <Banknote size={12} />,
  FILE_UPLOADED:   <Upload size={12} />,
  SALE_REGISTERED: <Receipt size={12} />,
  NOTE_ADDED:      <FileText size={12} />,
}

function TimelineTab({
  timeline, locale, tc,
}: {
  timeline: CarDetailData['timeline']
  locale: string
  tc: (k: string) => string
}) {
  if (timeline.length === 0) return (
    <div className="py-8 text-center text-gray-400 text-sm">
      <Clock size={28} className="mx-auto mb-2 text-gray-200" />
      {tc('noData')}
    </div>
  )
  return (
    <ol className="relative space-y-0" style={{ borderInlineEnd: '2px solid #f3f4f6', marginInlineEnd: '10px' }}>
      {timeline.map((e) => (
        <li key={e.id} className="mb-4" style={{ paddingInlineEnd: '20px' }}>
          <span
            className="absolute w-5 h-5 rounded-full border-2 border-white bg-[#C9A84C] flex items-center justify-center text-white"
            style={{ insetInlineEnd: '-11px', top: '4px' }}
          >
            {TIMELINE_ICON[e.eventType] ?? <ChevronRight size={10} />}
          </span>
          <div className="bg-white border border-gray-100 rounded-[8px] px-3 py-2.5 hover:border-gray-200 transition-colors">
            <p className="text-sm font-medium text-gray-800">{timelineLabel(e.eventType, e.payload)}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <CalendarDays size={10} /> {e.userName} · {formatDateTime(e.createdAt, locale)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ car, tc }: { car: CarDetailData; tc: (k: string) => string }) {
  const [uploading, setUploading] = useState(false)
  async function onUpload(files: FileList | null) {
    if (!files?.[0]) return
    setUploading(true)
    try {
      const file = files[0]
      const { key } = await uploadFile({ file, carId: car.id, category: 'document' })
      await fetch(`/api/v1/cars/${car.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType: 'OTHER', fileUrl: key, fileName: file.name, fileSize: file.size }),
      })
      window.location.reload()
    } finally { setUploading(false) }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-gray-200 p-5 text-sm text-gray-500 cursor-pointer hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors max-w-sm">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        رفع مستند (PDF)
        <input type="file" accept="application/pdf" hidden onChange={(e) => onUpload(e.target.files)} />
      </label>
      {car.documents.length === 0 ? (
        <p className="text-sm text-gray-400">{tc('noData')}</p>
      ) : (
        <ul className="space-y-2 max-w-md">
          {car.documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-3 rounded-[8px] border border-gray-100 hover:bg-gray-50">
              <FileText size={14} className="text-gray-300 shrink-0" />
              <span className="text-sm flex-1">{d.fileName}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{d.docType}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Accidents Tab ────────────────────────────────────────────────────────────

function AccidentsTab({ carId, t, tc }: { carId: string; t: (k: string) => string; tc: (k: string) => string }) {
  const [state, setState]     = useState<'idle' | 'loading' | 'clean' | 'has' | 'error'>('idle')
  const [accidents, setAccidents] = useState<{ accidentNumber: number; accidentDate: string }[]>([])
  const [errorMsg, setErrorMsg]   = useState('')
  const [open, setOpen]           = useState<number | null>(null)

  async function check() {
    setState('loading')
    try {
      const res  = await fetch(`/api/v1/cars/${carId}/accidents`)
      const json = await res.json() as { success?: boolean; error?: { message?: string }; data?: { clean?: boolean; accidents?: typeof accidents } }
      if (!json.success) { setErrorMsg(json.error?.message ?? tc('error')); setState('error'); return }
      setAccidents(json.data?.accidents ?? [])
      setState(json.data?.clean ? 'clean' : 'has')
    } catch { setState('error') }
  }

  return (
    <div className="space-y-4 max-w-lg">
      {state === 'idle' && (
        <button className="btn-primary" onClick={check}>{t('accidents')}</button>
      )}
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> {tc('loading')}
        </div>
      )}
      {state === 'error' && <p className="text-sm text-red-500">{errorMsg || tc('error')}</p>}
      {state === 'clean' && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-[10px] p-4 text-sm">
          <ShieldCheck size={18} className="shrink-0" /> {t('noAccidents')}
        </div>
      )}
      {state === 'has' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-[10px] p-4 text-sm">
            <AlertTriangle size={18} className="shrink-0" /> {t('hasAccidents')} ({accidents.length})
          </div>
          {accidents.map((a) => (
            <div key={a.accidentNumber} className="rounded-[8px] border border-gray-100 overflow-hidden">
              <button className="flex items-center justify-between w-full p-3 hover:bg-gray-50 text-sm"
                onClick={() => setOpen(open === a.accidentNumber ? null : a.accidentNumber)}>
                <span className="font-medium">حادثة #{a.accidentNumber}</span>
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  {a.accidentDate} <ChevronDown size={12} className={open === a.accidentNumber ? 'rotate-180' : ''} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mojaz Tab ────────────────────────────────────────────────────────────────

function MojazTab({ car, t, tc, ta }: { car: CarDetailData; t: (k: string) => string; tc: (k: string) => string; ta: (k: string) => string }) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl]         = useState<string | null>(car.mojazReportUrl)

  async function issue() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/v1/cars/${car.id}/mojaz`, { method: 'POST' })
      const json = await res.json() as { success?: boolean; data?: { pdfUrl?: string }; error?: { message?: string } }
      if (json.success) {
        setUrl(json.data?.pdfUrl ?? null)
        toast.success('تم إصدار تقرير موجاز بنجاح')
      } else {
        toast.error(json.error?.message ?? tc('error'))
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 max-w-md">
      <button className="btn-primary flex items-center gap-1.5" onClick={issue} disabled={loading}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        {t('mojazReport')}
      </button>
      {car.numberOfOwners != null && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={14} className="text-gray-400" /> عدد الملاك: <strong>{car.numberOfOwners}</strong>
        </div>
      )}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-1.5">
          <FileDown size={14} /> {ta('downloadReport')}
        </a>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SpecRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-green-700 price-number ltr' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function FinRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`${bold ? 'font-bold text-gray-700' : 'text-gray-500'}`}>{label}</span>
      <span className={`price-number font-mono ltr ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
        {value.toLocaleString()} ر.س
      </span>
    </div>
  )
}
