'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Printer, ArrowRight } from 'lucide-react'
import QRCode from 'qrcode'
import { formatPrice } from '@/lib/format'
import { formatCarRef, formatShowroomId } from '@/lib/format'

interface CarData {
  id:            string
  carRefNumber:  number
  year:          number
  carType:       string
  odometer:      number | null
  fuelType:      string | null
  transmission:  string | null
  colorExt:      string | null
  colorInt:      string | null
  engineSize:    string | null
  vin:           string | null
  plateNumber:   string | null
  sellPrice:     number | null
  notes:         string | null
  brandNameAr:   string
  categoryName:  string
  modelName:     string
  coverImageUrl: string | null
}

interface ShowroomData {
  name:           string
  city:           string | null
  logoUrl:        string | null
  whatsapp:       string | null
  phone:          string | null
  showroomNumber: number | null
}

interface Props {
  car:       CarData
  showroom:  ShowroomData
  publicUrl: string
  locale:    string
}

export default function PrintSlipClient({ car, showroom, publicUrl, locale }: Props) {
  const t = useTranslations('printSlip')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [slipType, setSlipType]   = useState<'a4' | 'label'>('a4')

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width:         200,
      margin:        1,
      color:         { dark: '#0F3460', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl)
  }, [publicUrl])

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Controls bar — hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <a href="javascript:history.back()" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowRight size={14} /> {t('back')}
          </a>
          <span className="text-gray-300">|</span>
          <h1 className="font-semibold text-gray-800 text-sm">
            {t('printTitle')} {car.brandNameAr} {car.categoryName} {car.year}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Slip type selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-0.5">
            {(['a4', 'label'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSlipType(type)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                  slipType === type ? 'bg-white text-[#0F3460] shadow-sm' : 'text-gray-500'
                }`}
              >
                {type === 'a4' ? t('fullA4') : t('smallCard')}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#0F3460] text-white px-4 py-2 rounded-[8px] text-sm font-medium hover:bg-[#0d2d54]"
          >
            <Printer size={15} /> {t('print')}
          </button>
        </div>
      </div>

      {/* Print content */}
      <div className="flex justify-center p-8 print:p-0">
        {slipType === 'a4' ? (
          <A4Slip car={car} showroom={showroom} qrDataUrl={qrDataUrl} publicUrl={publicUrl} locale={locale} />
        ) : (
          <LabelSlip car={car} showroom={showroom} qrDataUrl={qrDataUrl} />
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: ${slipType === 'a4' ? 'A4' : '10cm 15cm'}; margin: 0; }
          body * { visibility: hidden !important; }
          .print-slip, .print-slip * { visibility: visible !important; }
          .print-slip { position: fixed !important; inset: 0 !important; }
        }
      `}</style>
    </div>
  )
}

// ── A4 Slip ──────────────────────────────────────────────────────────────────

function A4Slip({ car, showroom, qrDataUrl, publicUrl, locale }: Omit<Props, 'slipType'> & { qrDataUrl: string }) {
  const t = useTranslations('printSlip')
  const price = car.sellPrice

  return (
    <div
      className="print-slip bg-white w-[210mm] min-h-[297mm] shadow-lg"
      style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}
      dir="rtl"
    >
      {/* Header — Showroom branding */}
      <div className="bg-[#0F3460] text-white px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showroom.logoUrl && (
            <img src={showroom.logoUrl} className="w-12 h-12 rounded-full object-cover bg-white" alt="" />
          )}
          <div>
            <div className="text-lg font-bold">{showroom.name}</div>
            {showroom.city && <div className="text-white/70 text-sm">{showroom.city}</div>}
          </div>
        </div>
        <div className="text-left text-sm text-white/70 space-y-0.5">
          {showroom.phone   && <div>📞 {showroom.phone}</div>}
          {showroom.whatsapp && <div>💬 {showroom.whatsapp}</div>}
          {showroom.showroomNumber && (
            <div className="text-xs font-mono">{formatShowroomId(showroom.showroomNumber)}</div>
          )}
        </div>
      </div>

      {/* Car image */}
      {car.coverImageUrl && (
        <div className="px-8 pt-6">
          <img
            src={car.coverImageUrl}
            alt={`${car.brandNameAr} ${car.year}`}
            className="w-full h-56 object-cover rounded-[8px]"
          />
        </div>
      )}

      {/* Car title + price */}
      <div className="px-8 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0F3460]">
              {car.brandNameAr} {car.categoryName} {car.year}
            </h2>
            <p className="text-gray-500 mt-0.5">{car.modelName}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${
              car.carType === 'NEW' ? 'bg-green-100 text-green-700' :
              car.carType === 'USED_QUALIFIED' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {t(`conditions.${car.carType}` as Parameters<typeof t>[0]) ?? car.carType}
            </span>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400 mb-1">{t('price')}</div>
            {price ? (
              <>
                <div className="price-number text-3xl font-bold text-[#C9A84C] font-mono ltr">
                  {formatPrice(price, 'ar')}
                </div>
                <div className="text-sm text-gray-400">{t('sar')}</div>
              </>
            ) : (
              <div className="text-xl font-bold text-gray-400">{t('callForPrice')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Specs grid */}
      <div className="px-8 py-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('kilometers'),   value: car.odometer ? `${car.odometer.toLocaleString('ar-SA')} km` : '—' },
            { label: t('fuelType'),     value: car.fuelType ? (t(`fuels.${car.fuelType}` as Parameters<typeof t>[0]) ?? car.fuelType) : '—' },
            { label: t('transmission'), value: car.transmission ? (t(`transmissions.${car.transmission}` as Parameters<typeof t>[0]) ?? car.transmission) : '—' },
            { label: t('exteriorColor'), value: car.colorExt ?? '—' },
            { label: t('interiorColor'), value: car.colorInt ?? '—' },
            { label: t('engineSize'),   value: car.engineSize ?? '—' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-[8px] p-3">
              <div className="text-xs text-gray-400 mb-0.5">{s.label}</div>
              <div className="text-sm font-semibold text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>

        {/* VIN + Plate */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          {car.vin && (
            <div className="bg-gray-50 rounded-[8px] p-3">
              <div className="text-xs text-gray-400 mb-0.5">{t('vin')}</div>
              <div className="vin font-mono text-sm font-semibold text-gray-800 ltr">{car.vin}</div>
            </div>
          )}
          <div className="bg-gray-50 rounded-[8px] p-3">
            <div className="text-xs text-gray-400 mb-0.5">{t('plateNumber')}</div>
            <div className="font-mono text-sm font-semibold text-[#0F3460]">{formatCarRef(car.carRefNumber)}</div>
          </div>
        </div>

        {/* Notes */}
        {car.notes && (
          <div className="mt-3 p-3 bg-amber-50 rounded-[8px] border border-amber-100">
            <div className="text-xs text-amber-600 font-medium mb-1">{t('notes')}</div>
            <div className="text-sm text-gray-700">{car.notes}</div>
          </div>
        )}
      </div>

      {/* QR + footer */}
      <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-1">{t('qrHint')}</div>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR Code" className="w-24 h-24" />
          )}
          <div className="text-xs text-gray-400 mt-1 font-mono ltr break-all max-w-[200px]">
            {publicUrl}
          </div>
        </div>
        <div className="text-left text-sm text-gray-400">
          <div className="text-xs">{t('poweredBy')}</div>
          <div className="font-bold text-[#0F3460] text-lg">CarSell</div>
          <div className="text-xs">carsell.one</div>
        </div>
      </div>
    </div>
  )
}

// ── Label Slip (Small card ~10×15cm) ─────────────────────────────────────────

function LabelSlip({ car, showroom, qrDataUrl }: { car: CarData; showroom: ShowroomData; qrDataUrl: string }) {
  const t = useTranslations('printSlip')
  const price = car.sellPrice

  return (
    <div
      className="print-slip bg-white border border-gray-300 rounded-[8px] shadow-lg overflow-hidden"
      style={{ width: '10cm', minHeight: '15cm', fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-[#0F3460] text-white px-4 py-2.5 flex items-center justify-between">
        <div className="font-bold text-sm">{showroom.name}</div>
        {showroom.showroomNumber && (
          <div className="text-xs font-mono text-white/70">{formatShowroomId(showroom.showroomNumber)}</div>
        )}
      </div>

      {/* Image */}
      {car.coverImageUrl && (
        <img src={car.coverImageUrl} className="w-full h-32 object-cover" alt="" />
      )}

      {/* Content */}
      <div className="p-4">
        <h2 className="font-bold text-[#0F3460] text-base">
          {car.brandNameAr} {car.categoryName} {car.year}
        </h2>
        <p className="text-xs text-gray-500">{car.modelName} · {t(`conditions.${car.carType}` as Parameters<typeof t>[0]) ?? car.carType}</p>

        {/* Price */}
        {price && (
          <div className="mt-3 bg-[#C9A84C]/10 rounded-[6px] p-2 text-center">
            <div className="price-number text-xl font-bold text-[#C9A84C] font-mono ltr">
              {formatPrice(price, 'ar')}
            </div>
            <div className="text-xs text-gray-500">{t('sar')}</div>
          </div>
        )}

        {/* Key specs */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          {car.odometer    && <div className="flex items-center gap-1 text-gray-600">🔢 {car.odometer.toLocaleString('ar-SA')} km</div>}
          {car.fuelType    && <div className="flex items-center gap-1 text-gray-600">⛽ {t(`fuels.${car.fuelType}` as Parameters<typeof t>[0]) ?? car.fuelType}</div>}
          {car.colorExt    && <div className="flex items-center gap-1 text-gray-600">🎨 {car.colorExt}</div>}
          {car.transmission && <div className="flex items-center gap-1 text-gray-600">⚙️ {t(`transmissions.${car.transmission}` as Parameters<typeof t>[0]) ?? car.transmission}</div>}
        </div>

        {car.vin && (
          <div className="mt-2 text-[10px] text-gray-400 font-mono ltr">{car.vin}</div>
        )}

        {/* QR code */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
          )}
          <div className="text-left">
            <div className="text-xs text-gray-400">{t('plateNumber')}</div>
            <div className="font-mono font-bold text-[#0F3460]">{formatCarRef(car.carRefNumber)}</div>
            {showroom.phone && <div className="text-xs text-gray-500 mt-1">{showroom.phone}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
