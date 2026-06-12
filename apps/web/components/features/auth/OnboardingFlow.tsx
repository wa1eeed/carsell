'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Check, ShieldCheck, Upload, Clock } from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'

type StepKey = 'personalInfo' | 'identity' | 'showroomInfo'

interface Props {
  accountType: string
  completedSteps: string[]
  nafathVerified: boolean
  kycStatus: string
  initialPhone?: string
  initialCity?: string
}

export function OnboardingFlow({ accountType, completedSteps, nafathVerified, kycStatus, initialPhone = '', initialCity = '' }: Props) {
  const t = useTranslations('auth.onboarding')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const needsShowroom = accountType === 'SHOWROOM' || accountType === 'AGENCY'

  const steps = useMemo<{ key: StepKey; label: string }[]>(() => {
    const base: { key: StepKey; label: string }[] = [
      { key: 'personalInfo', label: t('personalInfo') },
      { key: 'identity',     label: t('identity') },
    ]
    if (needsShowroom) base.push({ key: 'showroomInfo', label: t('showroomInfo') })
    return base
  }, [needsShowroom, t])

  const [done, setDone] = useState<string[]>(completedSteps)
  const [current, setCurrent] = useState<StepKey>(
    () => steps.find((s) => !completedSteps.includes(s.key))?.key ?? steps[0].key,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Progress: 20 base + weighted per step
  const progress = useMemo(() => {
    let pct = 20
    if (done.includes('personalInfo')) pct += 30
    if (done.includes('identity')) pct += 30
    if (!needsShowroom || done.includes('showroomInfo')) pct += 20
    return Math.min(pct, 100)
  }, [done, needsShowroom])

  async function submitStep(endpoint: string, body: object, stepKey: StepKey) {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/v1/profile/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.success) {
      setError(json.error?.message ?? tc('error'))
      return false
    }
    return true
  }

  function advance(stepKey: StepKey) {
    const newDone = done.includes(stepKey) ? done : [...done, stepKey]
    setDone(newDone)
    const next = steps.find((s) => !newDone.includes(s.key))
    if (next) setCurrent(next.key)
    else router.push(`/${locale}/dashboard`)
  }

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar progress (Navy) */}
      <aside className="rounded-card p-6 text-white" style={{ background: '#0F3460' }}>
        <h2 className="text-lg font-semibold mb-1">{t('title')}</h2>
        <div className="text-xs mb-5" style={{ color: 'rgba(248,250,252,0.65)' }}>
          {progress}%
        </div>
        <div className="h-2 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: '#C9A84C' }} />
        </div>

        <ul className="space-y-3">
          <StepItem label={tc('success')} active={false} complete />
          {steps.map((s) => (
            <StepItem
              key={s.key}
              label={s.label}
              active={current === s.key}
              complete={done.includes(s.key)}
            />
          ))}
        </ul>
      </aside>

      {/* Step content */}
      <section className="cl-card">
        {error && <p className="text-sm text-cl-danger mb-4">{error}</p>}

        {current === 'personalInfo' && (
          <PersonalInfoStep
            saving={saving}
            initialPhone={initialPhone}
            initialCity={initialCity}
            onSubmit={async (data) => {
              if (await submitStep('personal-info', data, 'personalInfo')) advance('personalInfo')
            }}
            onSkip={() => router.push(`/${locale}/dashboard`)}
          />
        )}

        {current === 'identity' && (
          <IdentityStep
            nafathVerified={nafathVerified}
            kycStatus={kycStatus}
            saving={saving}
            onNafathDone={() => advance('identity')}
            onSubmitManual={async (data) => {
              await submitStep('identity', data, 'identity')
              // Manual KYC stays pending; move user along to dashboard
              router.push(`/${locale}/dashboard`)
            }}
            onSkip={() => router.push(`/${locale}/dashboard`)}
          />
        )}

        {current === 'showroomInfo' && (
          <ShowroomInfoStep
            saving={saving}
            onSubmit={async (data) => {
              if (await submitStep('showroom-info', data, 'showroomInfo')) advance('showroomInfo')
            }}
            onSkip={() => router.push(`/${locale}/dashboard`)}
          />
        )}
      </section>
    </div>
  )
}

function StepItem({ label, active, complete }: { label: string; active: boolean; complete?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
        style={{
          background: complete ? '#C9A84C' : active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
          color: '#fff',
        }}
      >
        {complete ? <Check size={14} /> : '○'}
      </span>
      <span style={{ color: active || complete ? '#fff' : 'rgba(248,250,252,0.65)' }}>{label}</span>
    </li>
  )
}

// ─── Step: Personal Info ─────────────────────

function PersonalInfoStep({
  saving,
  initialPhone = '',
  initialCity = '',
  onSubmit,
  onSkip,
}: {
  saving: boolean
  initialPhone?: string
  initialCity?: string
  onSubmit: (data: { phone: string; city: string; email?: string; dateOfBirth?: string }) => void
  onSkip: () => void
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [phone, setPhone] = useState(initialPhone)
  const [city, setCity] = useState(initialCity)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ phone, city })
      }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">{t('onboarding.personalInfo')}</h3>
      <div>
        <label className="cl-label">{t('phone')}</label>
        <PhoneInput value={phone} onChange={setPhone} required />
      </div>
      <div>
        <label className="cl-label">المدينة</label>
        <input className="cl-input" placeholder="الرياض" value={city} onChange={(e) => setCity(e.target.value)} required />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary justify-center" onClick={onSkip}>
          {tc('skip')}
        </button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
          {saving ? tc('loading') : tc('next')}
        </button>
      </div>
    </form>
  )
}

// ─── Step: Identity (KYC) ────────────────────

function IdentityStep({
  nafathVerified,
  kycStatus,
  saving,
  onNafathDone,
  onSubmitManual,
  onSkip,
}: {
  nafathVerified: boolean
  kycStatus: string
  saving: boolean
  onNafathDone: () => void
  onSubmitManual: (data: { nationalId: string; idExpiryDate: string; kycDocFront: string }) => void
  onSkip: () => void
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [mode, setMode] = useState<'nafath' | 'manual'>('nafath')
  const [nationalId, setNationalId] = useState('')
  const [idExpiryDate, setIdExpiryDate] = useState('')
  const [docFront, setDocFront] = useState('')

  if (nafathVerified) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('onboarding.identity')}</h3>
        <div className="flex items-center gap-2 rounded-input bg-cl-success-light text-cl-success text-sm p-4">
          <ShieldCheck size={18} /> موثّق عبر نفاذ الوطني
        </div>
        <button className="btn-primary w-full justify-center" onClick={onNafathDone}>
          {tc('next')}
        </button>
      </div>
    )
  }

  if (kycStatus === 'PENDING') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('onboarding.identity')}</h3>
        <div className="flex items-center gap-2 rounded-input bg-cl-warning-light text-cl-warning text-sm p-4">
          <Clock size={18} /> قيد المراجعة (خلال 24 ساعة)
        </div>
        <button className="btn-secondary w-full justify-center" onClick={onSkip}>
          {tc('skip')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('onboarding.identity')}</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('nafath')}
          className={`flex-1 rounded-input border p-2 text-sm ${mode === 'nafath' ? 'border-cl-primary bg-cl-primary-light' : 'border-cl-gray-200'}`}
        >
          نفاذ (فوري)
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-input border p-2 text-sm ${mode === 'manual' ? 'border-cl-primary bg-cl-primary-light' : 'border-cl-gray-200'}`}
        >
          رفع مستندات
        </button>
      </div>

      {mode === 'nafath' && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-input py-2.5 text-white font-medium text-sm"
          style={{ background: '#2D8B55' }}
          onClick={async () => {
            const res = await fetch('/api/v1/auth/nafath/session')
            const json = await res.json()
            if (json.success && json.data?.redirectUrl) window.location.href = json.data.redirectUrl
          }}
        >
          <ShieldCheck size={18} /> {t('loginWithNafath')}
        </button>
      )}

      {mode === 'manual' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmitManual({ nationalId, idExpiryDate, kycDocFront: docFront })
          }}
          className="space-y-4"
        >
          <div>
            <label className="cl-label">رقم الهوية</label>
            <input className="cl-input id-number" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
          </div>
          <div>
            <label className="cl-label">تاريخ انتهاء الهوية</label>
            <input className="cl-input" value={idExpiryDate} onChange={(e) => setIdExpiryDate(e.target.value)} required />
          </div>
          <div>
            <label className="cl-label">صورة الهوية (أمامي)</label>
            <div className="flex items-center gap-2 rounded-input border border-dashed border-cl-gray-200 p-4 text-sm text-cl-gray-600">
              <Upload size={18} />
              <input
                type="text"
                className="cl-input"
                placeholder="رابط الملف المرفوع"
                value={docFront}
                onChange={(e) => setDocFront(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? tc('loading') : tc('submit')}
          </button>
        </form>
      )}

      <button type="button" className="btn-secondary w-full justify-center" onClick={onSkip}>
        {tc('skip')}
      </button>
    </div>
  )
}

// ─── Step: Showroom Info ─────────────────────

function ShowroomInfoStep({
  saving,
  onSubmit,
  onSkip,
}: {
  saving: boolean
  onSubmit: (data: {
    activityType: string
    name: string
    city: string
    commercialReg: string
    whatsapp: string
    commercialRegDoc: string
  }) => void
  onSkip: () => void
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [commercialReg, setCommercialReg] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [commercialRegDoc, setCommercialRegDoc] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ activityType: 'showroom', name, city, commercialReg, whatsapp, commercialRegDoc })
      }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">{t('onboarding.showroomInfo')}</h3>
      <div>
        <label className="cl-label">اسم المعرض</label>
        <input className="cl-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="cl-label">المدينة</label>
        <input className="cl-input" value={city} onChange={(e) => setCity(e.target.value)} required />
      </div>
      <div>
        <label className="cl-label">رقم السجل التجاري</label>
        <input className="cl-input" value={commercialReg} onChange={(e) => setCommercialReg(e.target.value)} required />
      </div>
      <div>
        <label className="cl-label">واتساب للتواصل</label>
        <PhoneInput value={whatsapp} onChange={setWhatsapp} required />
      </div>
      <div>
        <label className="cl-label">صورة السجل التجاري</label>
        <input
          className="cl-input"
          placeholder="رابط الملف المرفوع"
          value={commercialRegDoc}
          onChange={(e) => setCommercialRegDoc(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn-secondary justify-center" onClick={onSkip}>
          {tc('skip')}
        </button>
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
          {saving ? tc('loading') : t('onboarding.complete')}
        </button>
      </div>
    </form>
  )
}
