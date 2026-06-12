'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { FileText, Link2, ShieldCheck, Upload, Loader2 } from 'lucide-react'
import { SaudiPlate } from './SaudiPlate'
import { Price } from '@/components/ui/Price'
import { calcNetProfit } from '@/lib/tax'
import { buildPlateNumber } from '@/lib/saudi-plate'
import { uploadFile } from '@/lib/upload-client'
import { formatNumber } from '@/lib/format'

interface Option { id: string; nameAr: string; nameEn: string }
interface ModelOption { id: string; name: string }
type EntryMode = 'choose' | 'manual' | 'vdm'

const YEARS = Array.from({ length: new Date().getFullYear() + 1 - 2000 + 1 }, (_, i) => new Date().getFullYear() + 1 - i)
const CAR_TYPES = ['NEW', 'USED', 'USED_QUALIFIED'] as const
const FUELS = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const
const TRANSMISSIONS = ['AUTOMATIC', 'MANUAL'] as const
const PLATE_TYPES = ['PRIVATE', 'TAXI', 'TRANSPORT', 'DIPLOMAT'] as const

export function CarForm() {
  const t = useTranslations('car')
  const tf = useTranslations('car.fields')
  const tc = useTranslations('common')
  const ta = useTranslations('carForm')
  const locale = useLocale()
  const router = useRouter()
  const prefix = locale === 'ar' ? '' : '/en'

  const [mode, setMode] = useState<EntryMode>('choose')
  const [vdmReadonly, setVdmReadonly] = useState(false)

  // Catalog cascade
  const [brands, setBrands] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [models, setModels] = useState<ModelOption[]>([])

  // Form state
  const [brandId, setBrandId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [modelId, setModelId] = useState('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [carType, setCarType] = useState<(typeof CAR_TYPES)[number]>('USED')
  const [vin, setVin] = useState('')
  const [colorExt, setColorExt] = useState('')
  const [colorInt, setColorInt] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [transmission, setTransmission] = useState('')
  const [odometer, setOdometer] = useState('')
  const [notes, setNotes] = useState('')

  const [purchasePrice, setPurchasePrice] = useState('')
  const [extraCosts, setExtraCosts] = useState('')
  const [displayMode, setDisplayMode] = useState<'FIXED_PRICE' | 'SOUM'>('FIXED_PRICE')
  const [sellPrice, setSellPrice] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'FOR_SALE' | 'RESERVED'>('DRAFT')

  const [plateLetters, setPlateLetters] = useState<string[]>([])
  const [plateNumbers, setPlateNumbers] = useState('')
  const [plateType, setPlateType] = useState<(typeof PLATE_TYPES)[number]>('PRIVATE')

  const [dataSource, setDataSource] = useState<'MANUAL' | 'VDM_VIN' | 'VDM_ABSHER'>('MANUAL')
  const [vdmSequenceNumber, setVdmSequenceNumber] = useState('')

  const [imageKeys, setImageKeys] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load brands once
  useEffect(() => {
    fetch('/api/v1/catalog/brands')
      .then((r) => r.json())
      .then((j) => j.success && setBrands(j.data))
      .catch(() => {})
  }, [])

  // Cascade: categories
  useEffect(() => {
    if (!brandId) return setCategories([])
    fetch(`/api/v1/catalog/brands?brandId=${brandId}`)
      .then((r) => r.json())
      .then((j) => j.success && setCategories(j.data))
      .catch(() => {})
  }, [brandId])

  // Cascade: models
  useEffect(() => {
    if (!categoryId) return setModels([])
    fetch(`/api/v1/catalog/brands?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((j) => j.success && setModels(j.data))
      .catch(() => {})
  }, [categoryId])

  const pricing = calcNetProfit({
    carType,
    sellPrice: Number(sellPrice) || 0,
    purchasePrice: Number(purchasePrice) || 0,
    extraCosts: Number(extraCosts) || 0,
  })

  async function handleVdmLookup(by: 'vin' | 'sequence') {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/v1/cars/vdm-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(by === 'vin' ? { vin } : { sequence: vdmSequenceNumber }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? tc('error'))
        return
      }
      const { mapped, resolved } = json.data
      if (mapped.year) setYear(Number(mapped.year))
      if (mapped.colorExt) setColorExt(mapped.colorExt)
      if (mapped.fuelType) setFuelType(mapped.fuelType)
      if (mapped.transmission) setTransmission(mapped.transmission)
      if (mapped.vin) setVin(mapped.vin)
      if (mapped.vehicleSequenceNumber) setVdmSequenceNumber(mapped.vehicleSequenceNumber)
      if (resolved.brandId) setBrandId(resolved.brandId)
      if (resolved.categoryId) setCategoryId(resolved.categoryId)
      if (resolved.modelId) setModelId(resolved.modelId)
      setDataSource(by === 'vin' ? 'VDM_VIN' : 'VDM_ABSHER')
      setVdmReadonly(true)
      setMode('manual')
    } catch {
      setError(tc('error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files) return
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, 20 - imageKeys.length)) {
        const { key } = await uploadFile({ file, category: 'image' })
        setImageKeys((prev) => [...prev, key])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tc('error'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        brandId,
        categoryId,
        modelId,
        year,
        carType,
        vin: vin || undefined,
        colorExt: colorExt || undefined,
        colorInt: colorInt || undefined,
        fuelType: fuelType || undefined,
        transmission: transmission || undefined,
        odometer: odometer ? Number(odometer) : undefined,
        notes: notes || undefined,
        status,
        purchasePrice: Number(purchasePrice),
        extraCosts: extraCosts ? Number(extraCosts) : 0,
        sellPrice: sellPrice ? Number(sellPrice) : undefined,
        plateNumber: plateNumbers ? buildPlateNumber(plateLetters, plateNumbers) : undefined,
        plateType: plateNumbers ? plateType : undefined,
        dataSource,
        vdmSequenceNumber: vdmSequenceNumber || undefined,
        images: imageKeys.map((url, i) => ({ url, isCover: i === 0 })),
      }
      const res = await fetch('/api/v1/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? tc('error'))
        return
      }
      router.push(`${prefix}/inventory/${json.data.id}`)
    } catch {
      setError(tc('error'))
    } finally {
      setSaving(false)
    }
  }

  // ── Entry mode chooser ──
  if (mode === 'choose') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <button onClick={() => setMode('manual')} className="cl-card text-start">
          <FileText size={28} className="text-cl-primary mb-3" />
          <h3 className="font-semibold">{t('manualEntry')}</h3>
          <p className="text-sm text-cl-gray-600 mt-1">{ta('manualDesc')}</p>
        </button>
        <button onClick={() => setMode('vdm')} className="cl-card text-start">
          <Link2 size={28} className="text-cl-accent mb-3" />
          <h3 className="font-semibold">{t('pullFromAbsher')}</h3>
          <p className="text-sm text-cl-gray-600 mt-1">{ta('vdmDesc')}</p>
        </button>
      </div>
    )
  }

  // ── VDM pull screen ──
  if (mode === 'vdm') {
    return (
      <div className="cl-card max-w-lg space-y-4">
        <h3 className="font-semibold">{t('pullFromAbsher')}</h3>
        {error && <p className="text-sm text-cl-danger">{error}</p>}
        <div>
          <label className="cl-label">{tf('vin')}</label>
          <div className="flex gap-2">
            <input className="cl-input vin" value={vin} onChange={(e) => setVin(e.target.value)} />
            <button className="btn-primary" disabled={!vin || saving} onClick={() => handleVdmLookup('vin')}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : tc('search')}
            </button>
          </div>
        </div>
        <div className="text-center text-xs text-cl-gray-400">{tc('or')}</div>
        <div>
          <label className="cl-label">{ta('sequenceNumber')}</label>
          <div className="flex gap-2">
            <input className="cl-input ltr" value={vdmSequenceNumber} onChange={(e) => setVdmSequenceNumber(e.target.value)} />
            <button className="btn-primary" disabled={!vdmSequenceNumber || saving} onClick={() => handleVdmLookup('sequence')}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : tc('search')}
            </button>
          </div>
        </div>
        <button className="btn-secondary w-full justify-center" onClick={() => setMode('choose')}>
          {tc('back')}
        </button>
      </div>
    )
  }

  // ── Main form ──
  const ro = vdmReadonly
  const roClass = ro ? 'bg-cl-primary-light' : ''

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {ro && (
          <div className="flex items-center gap-2 rounded-input bg-cl-primary-light text-cl-primary text-sm p-3">
            <ShieldCheck size={16} /> {ta('vdmVerify')}
          </div>
        )}
        {error && <p className="text-sm text-cl-danger">{error}</p>}

        {/* Section 1: identification */}
        <section className="cl-card space-y-4">
          <h3 className="font-semibold">{t('addCar')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tf('brand')}>
              <select className={`cl-input ${roClass}`} value={brandId} onChange={(e) => { setBrandId(e.target.value); setCategoryId(''); setModelId('') }} required disabled={ro}>
                <option value="">—</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </Field>
            <Field label={tf('category')}>
              <select className={`cl-input ${roClass}`} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setModelId('') }} required disabled={ro || !brandId}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </Field>
            <Field label={tf('model')}>
              <select className={`cl-input ${roClass}`} value={modelId} onChange={(e) => setModelId(e.target.value)} required disabled={ro || !categoryId}>
                <option value="">—</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label={tf('year')}>
              <select className={`cl-input ${roClass}`} value={year} onChange={(e) => setYear(Number(e.target.value))} disabled={ro}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label={tf('carType')}>
              <select className="cl-input" value={carType} onChange={(e) => setCarType(e.target.value as typeof carType)}>
                {CAR_TYPES.map((ct) => <option key={ct} value={ct}>{t(`type.${ct}`)}</option>)}
              </select>
            </Field>
            <Field label={tf('vin')}>
              <input className={`cl-input vin ${roClass}`} value={vin} onChange={(e) => setVin(e.target.value)} readOnly={ro} />
            </Field>
          </div>
        </section>

        {/* Section 2: specs */}
        <section className="cl-card space-y-4">
          <h3 className="font-semibold">{tf('bodyType')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tf('color')}><input className="cl-input" value={colorExt} onChange={(e) => setColorExt(e.target.value)} /></Field>
            <Field label={tf('colorInt')}><input className="cl-input" value={colorInt} onChange={(e) => setColorInt(e.target.value)} /></Field>
            <Field label={tf('odometer')}><input className="cl-input price-number" inputMode="numeric" value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label={tf('fuelType')}>
              <select className="cl-input" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                <option value="">—</option>
                {FUELS.map((f) => <option key={f} value={f}>{t(`fuel.${f}`)}</option>)}
              </select>
            </Field>
            <Field label={tf('transmission')}>
              <select className="cl-input" value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                <option value="">—</option>
                {TRANSMISSIONS.map((tr) => <option key={tr} value={tr}>{t(`transmission.${tr}`)}</option>)}
              </select>
            </Field>
          </div>
          <Field label={tf('notes')}>
            <textarea className="cl-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </section>

        {/* Section 3: pricing */}
        <section className="cl-card space-y-4">
          <h3 className="font-semibold">{tf('price')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label={tf('purchasePrice')}><input className="cl-input price-number" inputMode="numeric" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value.replace(/\D/g, ''))} required /></Field>
            <Field label={ta('extraCosts')}><input className="cl-input price-number" inputMode="numeric" value={extraCosts} onChange={(e) => setExtraCosts(e.target.value.replace(/\D/g, ''))} /></Field>
            <Field label={tf('status')}>
              <select className="cl-input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="DRAFT">{t('status.DRAFT')}</option>
                <option value="FOR_SALE">{t('status.FOR_SALE')}</option>
                <option value="RESERVED">{t('status.RESERVED')}</option>
              </select>
            </Field>
            <Field label={tf('sellPrice')}><input className="cl-input price-number" inputMode="numeric" value={sellPrice} onChange={(e) => setSellPrice(e.target.value.replace(/\D/g, ''))} /></Field>
          </div>
        </section>

        {/* Section 4: plate */}
        <section className="cl-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{tf('plateNumber')}</h3>
            <select className="cl-input !w-auto" value={plateType} onChange={(e) => setPlateType(e.target.value as typeof plateType)}>
              {PLATE_TYPES.map((pt) => <option key={pt} value={pt}>{t(`plateType.${pt}`)}</option>)}
            </select>
          </div>
          <SaudiPlate
            letters={plateLetters}
            numbers={plateNumbers}
            type={plateType}
            interactive
            onLettersChange={setPlateLetters}
            onNumbersChange={setPlateNumbers}
          />
        </section>

        {/* Section 5: images */}
        <section className="cl-card space-y-3">
          <h3 className="font-semibold">{t('gallery')}</h3>
          <label className="flex items-center justify-center gap-2 rounded-input border border-dashed border-cl-gray-200 p-6 text-sm text-cl-gray-600 cursor-pointer">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {ta('uploadImages')}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => handleImageUpload(e.target.files)} />
          </label>
          {imageKeys.length > 0 && <p className="text-xs text-cl-gray-600">{formatNumber(imageKeys.length, locale)} {ta('images')}</p>}
        </section>
      </div>

      {/* Real-time pricing sidebar */}
      <aside className="space-y-4">
        <div className="cl-card sticky top-6 space-y-3">
          <h3 className="font-semibold text-sm">{t('financial')}</h3>
          <Row label={tf('purchasePrice')} value={formatNumber(Number(purchasePrice) || 0, locale)} />
          <Row label={ta('plusExtraCosts')} value={formatNumber(Number(extraCosts) || 0, locale)} />
          <Row label={ta('totalCost')} value={formatNumber(pricing.totalCost, locale)} bold />
          <Row label={tf('sellPrice')} value={formatNumber(Number(sellPrice) || 0, locale)} />
          <Row label="- VAT" value={formatNumber(pricing.vatAmount, locale)} />
          <hr className="border-cl-gray-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm">{ta('netProfit')}</span>
            <span className={`price-number font-semibold ${pricing.netProfit >= 0 ? 'text-cl-success' : 'text-cl-danger'}`}>
              {formatNumber(pricing.netProfit, locale)}
            </span>
          </div>
          <Row label={ta('marginPct')} value={`${formatNumber(pricing.marginPct, locale)}%`} />

          <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : tc('save')}
          </button>
        </div>
      </aside>
    </form>
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cl-gray-600">{label}</span>
      <span className={`price-number ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}
