'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { RefreshCw, Send, Loader2, CheckCircle2, AlertTriangle, FileDown, Upload, ChevronDown, Receipt, Printer } from 'lucide-react'
import { SaudiPlate } from './SaudiPlate'
import { Price } from '@/components/ui/Price'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { calcNetProfit } from '@/lib/tax'
import { parsePlateNumber, type SaudiPlateType } from '@/lib/saudi-plate'
import { formatDateTime, formatNumber } from '@/lib/format'
import { uploadFile } from '@/lib/upload-client'
import toast from 'react-hot-toast'
import { PublishModal } from './PublishModal'
import { ShareButton } from '@/components/ui/ShareButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export interface CarDetailData {
  id: string
  brandName: string
  categoryName: string
  modelName: string
  year: number
  carType: 'NEW' | 'USED' | 'USED_QUALIFIED'
  status: 'DRAFT' | 'FOR_SALE' | 'AUCTION' | 'RESERVED' | 'SOLD'
  showroomSlug?: string | null
  vin: string | null
  colorExt: string | null
  colorInt: string | null
  fuelType: string | null
  transmission: string | null
  odometer: number | null
  notes: string | null
  purchasePrice: number
  extraCosts: number
  sellPrice: number | null
  plateNumber: string | null
  plateType: SaudiPlateType | null
  dataSource: 'MANUAL' | 'VDM_VIN' | 'VDM_ABSHER'
  engineSize: string | null
  mojazReportUrl: string | null
  numberOfOwners: number | null
  timeline: { id: string; eventType: string; payload: Record<string, unknown>; userName: string; createdAt: string }[]
  documents: { id: string; docType: string; fileName: string; fileUrl: string }[]
}

type Tab = 'details' | 'financial' | 'timeline' | 'documents' | 'accidents' | 'mojaz'

const TABS: Tab[] = ['details', 'financial', 'timeline', 'documents', 'accidents', 'mojaz']

export function CarDetail({ car }: { car: CarDetailData }) {
  const [publishOpen, setPublishOpen] = useState(false)
  const onPublish = () => setPublishOpen(true)
  const t = useTranslations('car')
  const tf = useTranslations('car.fields')
  const tc = useTranslations('common')
  const ta = useTranslations('actions')
  const ts = useTranslations('sale')
  const locale = useLocale()
  const prefix = locale === 'ar' ? '' : '/en'
  const [tab, setTab] = useState<Tab>('details')
  const [syncing, setSyncing] = useState(false)
  const [confirmAbsher, setConfirmAbsher] = useState(false)

  const showVdmUpdate = car.dataSource === 'MANUAL' && car.vin != null
  const plate = parsePlateNumber(car.plateNumber)

  async function updateFromAbsher() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/v1/cars/${car.id}/vdm-sync`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('تم تحديث البيانات من أبشر بنجاح')
        window.location.reload()
      } else {
        toast.error(json.error?.message ?? tc('error'))
      }
    } catch {
      toast.error(tc('error'))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-cl-primary">
            {car.brandName} {car.categoryName} {car.year}
          </h1>
          <StatusBadge status={car.status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showVdmUpdate && (
            <button className="btn-secondary" onClick={() => setConfirmAbsher(true)} disabled={syncing}>
              {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {ta('updateFromAbsher')}
            </button>
          )}
          {/* Print Slip */}
          <a
            href={`${prefix}/inventory/${car.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <Printer size={16} /> طباعة ورقة السيارة
          </a>
          {/* Share */}
          <ShareButton
            carId={car.id}
            carTitle={`${car.brandName} ${car.categoryName} ${car.year}`}
            price={car.sellPrice ? String(car.sellPrice) : undefined}
            source="dashboard"
            locale={locale}
          />
          {car.status !== 'SOLD' && (
            <button className="btn-gold" onClick={onPublish}>
              <Send size={16} /> {t('publishForSale')}
            </button>
          )}
          {car.status !== 'SOLD' && car.status !== 'DRAFT' && (
            <a className="btn-primary" href={`${prefix}/sales/new/${car.id}`}>
              <Receipt size={16} /> {ts('registerSale')}
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cl-gray-200 overflow-x-auto">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
            style={{
              borderColor: tab === tb ? '#C9A84C' : 'transparent',
              color: tab === tb ? '#0F3460' : '#475569',
            }}
          >
            {tabLabel(tb, t)}
          </button>
        ))}
      </div>

      {tab === 'details' && <DetailsTab car={car} plate={plate} t={t} tf={tf} />}
      {tab === 'financial' && <FinancialTab car={car} tf={tf} />}
      {tab === 'timeline' && <TimelineTab timeline={car.timeline} locale={locale} tc={tc} />}
      {tab === 'documents' && <DocumentsTab car={car} tc={tc} />}
      {tab === 'accidents' && <AccidentsTab carId={car.id} t={t} tc={tc} />}
      {tab === 'mojaz' && <MojazTab car={car} t={t} tc={tc} ta={ta} />}

      {publishOpen && (
        <PublishModal
          carId={car.id}
          onClose={() => setPublishOpen(false)}
          showroomSlug={car.showroomSlug}
        />
      )}

      <ConfirmDialog
        open={confirmAbsher}
        title="تحديث البيانات من أبشر"
        message="سيتم تحديث بيانات السيارة من نظام أبشر — هل تريد المتابعة؟"
        confirmLabel="تحديث"
        cancelLabel="إلغاء"
        variant="warning"
        onConfirm={() => { setConfirmAbsher(false); updateFromAbsher() }}
        onCancel={() => setConfirmAbsher(false)}
      />
    </div>
  )
}

function tabLabel(tab: Tab, t: (k: string) => string): string {
  const map: Record<Tab, string> = {
    details: t('carDetails'),
    financial: t('financial'),
    timeline: t('timeline'),
    documents: t('documents'),
    accidents: t('accidents'),
    mojaz: t('mojazReport'),
  }
  return map[tab]
}

function DetailsTab({
  car,
  plate,
  t,
  tf,
}: {
  car: CarDetailData
  plate: { letters: string[]; numbers: string }
  t: (k: string) => string
  tf: (k: string) => string
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="cl-card space-y-3">
        <h3 className="font-semibold">{t('carDetails')}</h3>
        <Spec label={tf('model')} value={car.modelName} />
        <Spec label={tf('carType')} value={t(`type.${car.carType}`)} />
        <Spec label={tf('vin')} value={car.vin ?? '—'} mono />
        <Spec label={tf('color')} value={car.colorExt ?? '—'} />
        <Spec label={tf('colorInt')} value={car.colorInt ?? '—'} />
        <Spec label={tf('odometer')} value={car.odometer != null ? String(car.odometer) : '—'} mono />
        <Spec label={tf('fuelType')} value={car.fuelType ? t(`fuel.${car.fuelType}`) : '—'} />
        <Spec label={tf('transmission')} value={car.transmission ? t(`transmission.${car.transmission}`) : '—'} />
        {car.notes && <Spec label={tf('notes')} value={car.notes} />}
      </section>

      <section className="cl-card flex flex-col items-center gap-4">
        <h3 className="font-semibold self-start">{tf('plateNumber')}</h3>
        {car.plateNumber ? (
          <SaudiPlate letters={plate.letters} numbers={plate.numbers} type={car.plateType ?? 'PRIVATE'} size="lg" />
        ) : (
          <p className="text-sm text-cl-gray-400">—</p>
        )}
      </section>
    </div>
  )
}

function FinancialTab({ car, tf }: { car: CarDetailData; tf: (k: string) => string }) {
  const p = calcNetProfit({
    carType: car.carType,
    sellPrice: car.sellPrice ?? 0,
    purchasePrice: car.purchasePrice,
    extraCosts: car.extraCosts,
  })
  return (
    <section className="cl-card max-w-md space-y-3">
      <h3 className="font-semibold">{tf('price')}</h3>
      <FinRow label={tf('purchasePrice')} value={car.purchasePrice} />
      <FinRow label="تكاليف إضافية" value={car.extraCosts} />
      <FinRow label="إجمالي التكلفة" value={p.totalCost} bold />
      <FinRow label={tf('sellPrice')} value={car.sellPrice ?? 0} />
      <FinRow label="VAT" value={p.vatAmount} />
      <hr className="border-cl-gray-100" />
      <div className="flex items-center justify-between">
        <span className="text-sm">صافي الربح</span>
        <span className={`price-number font-semibold ${p.netProfit >= 0 ? 'text-cl-success' : 'text-cl-danger'}`}>
          {p.netProfit.toLocaleString()}
        </span>
      </div>
    </section>
  )
}

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
    case 'FIELD_UPDATED':  return `تحديث حقل: ${payload.field ?? ''}`
    case 'PRICE_CHANGED':  return `تغيير السعر → ${payload.to ?? ''} ريال`
    case 'NOTE_ADDED':     return 'إضافة ملاحظة'
    case 'FILE_UPLOADED':  return 'رفع ملف'
    case 'FILE_DELETED':   return 'حذف ملف'
    case 'SALE_REGISTERED': return 'تسجيل بيع'
    case 'STATUS_CHANGED': {
      const to   = String(payload.to ?? '')
      const mode = payload.displayMode ? ` (${DISPLAY_MODE_AR[String(payload.displayMode)] ?? payload.displayMode})` : ''
      // Published
      if (payload.displayMode) return `نشر السيارة${mode} — ${CAR_STATUS_AR[to] ?? to}`
      // Request-driven
      const reqStatus = String(payload.requestStatus ?? '')
      if (reqStatus) {
        const buyer = payload.buyerName ? ` · ${payload.buyerName}` : ''
        return `${REQUEST_STATUS_AR[reqStatus] ?? reqStatus}${buyer} — السيارة: ${CAR_STATUS_AR[to] ?? to}`
      }
      const from = CAR_STATUS_AR[String(payload.from ?? '')] ?? payload.from ?? ''
      return `تغيير الحالة: ${from} ← ${CAR_STATUS_AR[to] ?? to}`
    }
    default: return eventType
  }
}

function TimelineTab({
  timeline,
  locale,
  tc,
}: {
  timeline: CarDetailData['timeline']
  locale: string
  tc: (k: string) => string
}) {
  if (timeline.length === 0) return <p className="text-sm text-cl-gray-400">{tc('noData')}</p>
  return (
    <ol className="relative border-r border-gray-100 mr-3 space-y-0">
      {timeline.map((e) => (
        <li key={e.id} className="mb-4 mr-6">
          <span className="absolute -right-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#C9A84C]" />
          <div className="bg-white border border-gray-100 rounded-[8px] px-3 py-2.5">
            <p className="text-sm font-medium text-gray-800">{timelineLabel(e.eventType, e.payload)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.userName} · {formatDateTime(e.createdAt, locale)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

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
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-center gap-2 rounded-input border border-dashed border-cl-gray-200 p-5 text-sm text-cl-gray-600 cursor-pointer max-w-md">
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        رفع مستند (PDF)
        <input type="file" accept="application/pdf" hidden onChange={(e) => onUpload(e.target.files)} />
      </label>
      {car.documents.length === 0 ? (
        <p className="text-sm text-cl-gray-400">{tc('noData')}</p>
      ) : (
        <ul className="space-y-2 max-w-md">
          {car.documents.map((d) => (
            <li key={d.id} className="cl-card flex items-center justify-between !py-3">
              <span className="text-sm">{d.fileName}</span>
              <span className="text-xs text-cl-gray-400">{d.docType}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AccidentsTab({ carId, t, tc }: { carId: string; t: (k: string) => string; tc: (k: string) => string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'clean' | 'has' | 'error'>('idle')
  const [accidents, setAccidents] = useState<{ accidentNumber: number; accidentDate: string }[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  async function check() {
    setState('loading')
    try {
      const res = await fetch(`/api/v1/cars/${carId}/accidents`)
      const json = await res.json()
      if (!json.success) {
        setErrorMsg(json.error?.message ?? tc('error'))
        setState('error')
        return
      }
      setAccidents(json.data.accidents ?? [])
      setState(json.data.clean ? 'clean' : 'has')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {state === 'idle' && (
        <button className="btn-primary" onClick={check}>
          {t('accidents')}
        </button>
      )}
      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-cl-gray-600">
          <Loader2 size={18} className="animate-spin" /> {tc('loading')}
        </div>
      )}
      {state === 'error' && <p className="text-sm text-cl-danger">{errorMsg || tc('error')}</p>}
      {state === 'clean' && (
        <div className="flex items-center gap-2 rounded-input bg-cl-success-light text-cl-success p-4 text-sm">
          <CheckCircle2 size={18} /> {t('noAccidents')}
        </div>
      )}
      {state === 'has' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-input bg-cl-danger-light text-cl-danger p-4 text-sm">
            <AlertTriangle size={18} /> {t('hasAccidents')} ({accidents.length})
          </div>
          {accidents.map((a) => (
            <div key={a.accidentNumber} className="cl-card !py-3">
              <button className="flex items-center justify-between w-full" onClick={() => setOpen(open === a.accidentNumber ? null : a.accidentNumber)}>
                <span className="text-sm">#{a.accidentNumber}</span>
                <span className="flex items-center gap-2 text-xs text-cl-gray-400">
                  {a.accidentDate} <ChevronDown size={14} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MojazTab({
  car,
  t,
  tc,
  ta,
}: {
  car: CarDetailData
  t: (k: string) => string
  tc: (k: string) => string
  ta: (k: string) => string
}) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(car.mojazReportUrl)

  async function issue() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/cars/${car.id}/mojaz`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setUrl(json.data.pdfUrl)
        toast.success('تم إصدار تقرير موجاز بنجاح')
        window.location.reload()
      } else {
        toast.error(json.error?.message ?? tc('error'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <button className="btn-primary" onClick={issue} disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {t('mojazReport')}
      </button>
      {car.numberOfOwners != null && <p className="text-sm text-cl-gray-600">عدد الملاك: {car.numberOfOwners}</p>}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="btn-secondary inline-flex">
          <FileDown size={16} /> {ta('downloadReport')}
        </a>
      )}
    </div>
  )
}

// ─── Small presentational helpers ───
function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cl-gray-600">{label}</span>
      <span className={mono ? 'vin' : ''}>{value}</span>
    </div>
  )
}

function FinRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cl-gray-600">{label}</span>
      <Price value={value} size="sm" />
      {bold ? null : null}
    </div>
  )
}
