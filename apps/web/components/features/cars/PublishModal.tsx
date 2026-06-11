'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Tag, Handshake, Gavel, X, CheckCircle2, Copy, Lock, Globe, Loader2, Store, ExternalLink } from 'lucide-react'

type Mode = 'choose' | 'FIXED_PRICE' | 'SOUM' | 'AUCTION'
type AuctionKind = 'PUBLIC' | 'PRIVATE'

interface PublishSuccess {
  mode: 'FIXED_PRICE' | 'SOUM' | 'AUCTION'
  status: string
  auctionType?: AuctionKind
  auctionUrl?: string
  auctionEndsAt?: string
  sellPrice?: number
}

const DURATIONS = [
  { h: 24, key: 'h24' },
  { h: 48, key: 'h48' },
  { h: 72, key: 'h72' },
  { h: 168, key: 'week1' },
] as const

export function PublishModal({
  carId,
  onClose,
  showroomSlug,
}: {
  carId:          string
  onClose:        () => void
  showroomSlug?:  string | null
}) {
  const t = useTranslations('publish')
  const tc = useTranslations('common')
  const [mode, setMode] = useState<Mode>('choose')
  const [success, setSuccess] = useState<PublishSuccess | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(body: object) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/v1/cars/${carId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? tc('error'))
        return
      }
      setSuccess(json.data)
    } catch {
      setError(tc('error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg cl-card !p-0 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-cl-gray-200">
          <h2 className="font-semibold">{t('title')}</h2>
          <button onClick={onClose} className="text-cl-gray-400 hover:text-cl-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {error && <p className="text-sm text-cl-danger mb-3">{error}</p>}

          {success ? (
            <SuccessScreen success={success} onClose={onClose} showroomSlug={showroomSlug} />
          ) : mode === 'choose' ? (
            <div className="grid grid-cols-1 gap-3">
              <OptionCard icon={Tag} title={t('fixedPrice')} onClick={() => setMode('FIXED_PRICE')} />
              <OptionCard icon={Handshake} title={t('soum')} onClick={() => setMode('SOUM')} />
              <OptionCard icon={Gavel} title={t('auction')} onClick={() => setMode('AUCTION')} />
            </div>
          ) : mode === 'FIXED_PRICE' ? (
            <FixedForm t={t} tc={tc} saving={saving} onBack={() => setMode('choose')} onSubmit={submit} />
          ) : mode === 'SOUM' ? (
            <SoumForm t={t} tc={tc} saving={saving} onBack={() => setMode('choose')} onSubmit={submit} />
          ) : (
            <AuctionForm t={t} tc={tc} saving={saving} onBack={() => setMode('choose')} onSubmit={submit} />
          )}
        </div>
      </div>
    </div>
  )
}

function OptionCard({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-card border border-cl-gray-200 p-4 hover:border-cl-primary text-start">
      <Icon size={22} className="text-cl-primary" />
      <span className="font-medium text-sm">{title}</span>
    </button>
  )
}

function FixedForm({
  t,
  tc,
  saving,
  onBack,
  onSubmit,
}: {
  t: (k: string) => string
  tc: (k: string) => string
  saving: boolean
  onBack: () => void
  onSubmit: (body: object) => void
}) {
  const [sellPrice, setSellPrice] = useState('')
  const [vatInclusive, setVatInclusive] = useState(false)
  const [contactMethod, setContactMethod] = useState('whatsapp')
  const [notes, setNotes] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ mode: 'FIXED_PRICE', sellPrice: Number(sellPrice), vatInclusive, contactMethod, notes: notes || undefined })
      }}
      className="space-y-4"
    >
      <Field label={t('displayPrice')}>
        <input className="cl-input price-number" inputMode="numeric" value={sellPrice} onChange={(e) => setSellPrice(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={vatInclusive} onChange={(e) => setVatInclusive(e.target.checked)} />
        {t('vatInclusive')}
      </label>
      <Field label={t('contactMethod')}>
        <select className="cl-input" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
          <option value="whatsapp">{t('contactWhatsapp')}</option>
          <option value="call">{t('contactCall')}</option>
          <option value="both">{t('contactBoth')}</option>
        </select>
      </Field>
      <Field label={tc('notes')}>
        <textarea className="cl-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Actions tc={tc} saving={saving} onBack={onBack} />
    </form>
  )
}

function SoumForm({
  t,
  tc,
  saving,
  onBack,
  onSubmit,
}: {
  t: (k: string) => string
  tc: (k: string) => string
  saving: boolean
  onBack: () => void
  onSubmit: (body: object) => void
}) {
  const [displayPrice, setDisplayPrice] = useState('')
  const [minAcceptedPrice, setMinAcceptedPrice] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ mode: 'SOUM', displayPrice: Number(displayPrice), minAcceptedPrice: Number(minAcceptedPrice), notes: notes || undefined })
      }}
      className="space-y-4"
    >
      <Field label={t('displayPrice')}>
        <input className="cl-input price-number" inputMode="numeric" value={displayPrice} onChange={(e) => setDisplayPrice(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      <Field label={t('minAcceptedPrice')}>
        <input className="cl-input price-number" inputMode="numeric" value={minAcceptedPrice} onChange={(e) => setMinAcceptedPrice(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      <Field label={tc('notes')}>
        <textarea className="cl-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Actions tc={tc} saving={saving} onBack={onBack} />
    </form>
  )
}

function AuctionForm({
  t,
  tc,
  saving,
  onBack,
  onSubmit,
}: {
  t: (k: string) => string
  tc: (k: string) => string
  saving: boolean
  onBack: () => void
  onSubmit: (body: object) => void
}) {
  const [auctionType, setAuctionType] = useState<AuctionKind>('PUBLIC')
  const [openingPrice, setOpeningPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [startDate, setStartDate] = useState('')
  const [durationHours, setDurationHours] = useState<number>(24)
  const [buyNowPrice, setBuyNowPrice] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          mode: 'AUCTION',
          auctionType,
          openingPrice: Number(openingPrice),
          deposit: deposit ? Number(deposit) : undefined,
          startDate: new Date(startDate).toISOString(),
          durationHours,
          buyNowPrice: buyNowPrice ? Number(buyNowPrice) : undefined,
        })
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAuctionType('PUBLIC')}
          className={`flex items-center justify-center gap-2 rounded-input border p-2 text-sm ${auctionType === 'PUBLIC' ? 'border-cl-primary bg-cl-primary-light' : 'border-cl-gray-200'}`}
        >
          <Globe size={16} /> {t('public')}
        </button>
        <button
          type="button"
          onClick={() => setAuctionType('PRIVATE')}
          className={`flex items-center justify-center gap-2 rounded-input border p-2 text-sm ${auctionType === 'PRIVATE' ? 'border-cl-primary bg-cl-primary-light' : 'border-cl-gray-200'}`}
        >
          <Lock size={16} /> {t('private')}
        </button>
      </div>

      <Field label={t('openingPrice')}>
        <input className="cl-input price-number" inputMode="numeric" value={openingPrice} onChange={(e) => setOpeningPrice(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      <Field label={t('deposit')}>
        <input className="cl-input price-number" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <Field label={t('startDate')}>
        <input type="datetime-local" className="cl-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </Field>
      <Field label={t('duration')}>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.h}
              type="button"
              onClick={() => setDurationHours(d.h)}
              className={`rounded-input border p-2 text-xs ${durationHours === d.h ? 'border-cl-primary bg-cl-primary-light' : 'border-cl-gray-200'}`}
            >
              {t(d.key)}
            </button>
          ))}
        </div>
      </Field>
      <Field label={t('buyNowPrice')}>
        <input className="cl-input price-number" inputMode="numeric" value={buyNowPrice} onChange={(e) => setBuyNowPrice(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <Actions tc={tc} saving={saving} onBack={onBack} />
    </form>
  )
}

function SuccessScreen({
  success,
  onClose,
  showroomSlug,
}: {
  success:       PublishSuccess
  onClose:       () => void
  showroomSlug?: string | null
}) {
  const t      = useTranslations('publish')
  const tc     = useTranslations('common')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)

  const origin          = typeof window !== 'undefined' ? window.location.origin : 'https://carlink.sa'
  const marketUrl       = `${origin}/${locale}/market`
  const showroomUrl     = showroomSlug ? `${origin}/${showroomSlug}` : null

  function copy(url: string) {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4 py-2" dir="rtl">
      <div className="text-center">
        {success.mode === 'AUCTION' && success.auctionType === 'PRIVATE' ? (
          <Lock size={36} className="mx-auto text-cl-primary mb-2" />
        ) : (
          <CheckCircle2 size={36} className="mx-auto text-green-500 mb-2" />
        )}
        <p className="font-bold text-[#0F3460] text-lg">تم نشر السيارة بنجاح! 🎉</p>
        {success.mode === 'FIXED_PRICE' && success.sellPrice != null && (
          <p className="price-number text-[#C9A84C] font-mono text-xl mt-1 ltr">
            {success.sellPrice.toLocaleString('ar-SA')} ريال
          </p>
        )}
        {success.mode === 'SOUM' && (
          <p className="text-sm text-gray-500 mt-1">قابل للتفاوض</p>
        )}
      </div>

      {/* Where is the car listed */}
      <div className="bg-gray-50 rounded-[10px] p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500 mb-2">السيارة ستظهر في:</p>

        {/* Showroom page */}
        {showroomUrl && (
          <div className="flex items-center gap-2 bg-white rounded-[8px] px-3 py-2 border border-gray-100">
            <Store size={14} className="text-[#0F3460] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700">صفحة معرضك</div>
              <div className="text-[10px] text-gray-400 font-mono ltr truncate">carlink.sa/{showroomSlug}</div>
            </div>
            <a href={showroomUrl} target="_blank" rel="noopener noreferrer"
              className="p-1 text-gray-400 hover:text-[#0F3460]" title="فتح">
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* CarSell Live */}
        <div className="flex items-center gap-2 bg-white rounded-[8px] px-3 py-2 border border-gray-100">
          <Globe size={14} className="text-[#C9A84C] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-700">CarSell Live</div>
            <div className="text-[10px] text-gray-400 font-mono ltr">carlink.sa/market</div>
          </div>
          <a href={marketUrl} target="_blank" rel="noopener noreferrer"
            className="p-1 text-gray-400 hover:text-[#C9A84C]" title="فتح">
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Private auction link */}
        {success.mode === 'AUCTION' && success.auctionType === 'PRIVATE' && success.auctionUrl && (
          <div className="bg-white rounded-[8px] border border-gray-100 p-2">
            <p className="text-xs text-gray-500 mb-1">{t('auctionLink')}</p>
            <div className="flex items-center gap-2">
              <input
                className="text-xs font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 ltr"
                readOnly
                value={success.auctionUrl}
              />
              <button
                type="button"
                onClick={() => copy(success.auctionUrl!)}
                className="text-[#0F3460] p-1"
              >
                {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="btn-primary w-full justify-center" onClick={onClose}>
        {tc('close')}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="cl-label">{label}</label>
      {children}
    </div>
  )
}

function Actions({ tc, saving, onBack }: { tc: (k: string) => string; saving: boolean; onBack: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" className="btn-secondary justify-center" onClick={onBack}>
        {tc('back')}
      </button>
      <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : tc('submit')}
      </button>
    </div>
  )
}
