'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Building2, User, Briefcase, Landmark, ShieldCheck, Check, Star } from 'lucide-react'
import { NafathButton } from '@/components/features/auth/NafathButton'
import type { PlanWithFeatures } from '@/repositories/plan.repository'

type AccountType = 'INDIVIDUAL' | 'SHOWROOM' | 'AGENCY' | 'COMPANY'
type Step = 1 | 2 | 3

const ACCOUNT_TYPES: { key: AccountType; icon: React.ElementType }[] = [
  { key: 'INDIVIDUAL', icon: User },
  { key: 'SHOWROOM',   icon: Building2 },
  { key: 'AGENCY',     icon: Briefcase },
  { key: 'COMPANY',    icon: Landmark },
]

// Accounts that need a subscription plan
const NEEDS_PLAN = new Set<AccountType>(['SHOWROOM', 'AGENCY', 'COMPANY'])

type BillingPeriod = 'MONTHLY' | 'YEARLY'

export default function RegisterPage() {
  const t  = useTranslations('auth')
  const tc = useTranslations('common')
  const locale  = useLocale()
  const router  = useRouter()
  const params  = useSearchParams()

  // Nafath pre-fill
  const nafathName       = params.get('name') ?? ''
  const nafathNationalId = params.get('nationalId') ?? ''
  const nafathIdType     = params.get('idType') ?? ''
  const isNafath         = !!nafathNationalId

  // Plan pre-selected from pricing page
  const preselectedPlanId = params.get('planId') ?? ''
  const preselectedPeriod = (params.get('period') ?? 'MONTHLY') as BillingPeriod

  const [step, setStep]               = useState<Step>(isNafath ? 2 : 1)
  const [accountType, setAccountType] = useState<AccountType>('SHOWROOM')
  const [name, setName]               = useState(nafathName)
  const [phone, setPhone]             = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  // Step 3 — plan
  const [plans, setPlans]             = useState<PlanWithFeatures[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(preselectedPlanId)
  const [billingPeriod, setBillingPeriod]   = useState<BillingPeriod>(preselectedPeriod)

  // total steps depends on account type
  const totalSteps: Step = NEEDS_PLAN.has(accountType) ? 3 : 2

  async function loadPlans() {
    setPlansLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/v1/plans')
      const data = await res.json() as { plans?: PlanWithFeatures[] }
      const list = data.plans ?? []
      setPlans(list)
      // auto-select featured plan if none preselected (enables the trial button)
      if (list.length > 0) {
        const featured = list.find((p) => p.isFeatured) ?? list[0]
        setSelectedPlanId((cur) => cur || featured.id)
      } else {
        setError('تعذّر تحميل الباقات — حاول لاحقاً أو تابع بـ «سأختار لاحقاً»')
      }
    } catch {
      setError('تعذّر تحميل الباقات — تحقق من اتصالك')
    } finally {
      setPlansLoading(false)
    }
  }

  function goToStep2() {
    setStep(2)
  }

  function goToStep3() {
    if (NEEDS_PLAN.has(accountType)) {
      loadPlans()
      setStep(3)
    } else {
      // submit without plan
      void submitForm(undefined, undefined)
    }
  }

  async function submitForm(planId?: string, period?: BillingPeriod) {
    setError('')
    setLoading(true)

    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountType,
        name,
        phone,
        email:         email || undefined,
        password,
        planId:        planId ?? undefined,
        billingPeriod: period ?? undefined,
        ...(isNafath ? { nationalId: nafathNationalId, idType: nafathIdType } : {}),
      }),
    })
    const json = await res.json() as { success?: boolean; error?: { message?: string } }

    if (!json.success) {
      setError(json.error?.message ?? tc('error'))
      setLoading(false)
      return
    }

    // Sign in
    if (email) {
      await signIn('credentials', { email, password, redirect: false })
    }
    router.push(`/${locale}/onboarding`)
  }

  async function onStep2Submit(e: React.FormEvent) {
    e.preventDefault()
    if (NEEDS_PLAN.has(accountType)) {
      await loadPlans()
      setStep(3)
    } else {
      await submitForm()
    }
  }

  async function onStep3Submit() {
    await submitForm(selectedPlanId, billingPeriod)
  }

  const yearlyDiscount = 20

  return (
    <div className="w-full max-w-lg" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-[#0F3460]">CarSell</h1>
        <p className="text-sm text-gray-500 mt-1">سوق السيارات الخليجي</p>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 p-6">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#0F3460]">{t('register')}</h2>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s < step ? 'bg-[#C9A84C] text-white' :
                  s === step ? 'bg-[#0F3460] text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {s < step ? <Check size={12} /> : s}
                </div>
                {s < totalSteps && <div className={`w-6 h-0.5 ${s < step ? 'bg-[#C9A84C]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1 — Account Type ── */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('accountType')}</label>
            <div className="grid grid-cols-2 gap-3">
              {ACCOUNT_TYPES.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccountType(key)}
                  className={`flex flex-col items-center gap-2 rounded-[12px] border-2 p-4 transition-all hover:-translate-y-0.5 ${
                    accountType === key
                      ? 'border-[#0F3460] bg-[#0F3460]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} className="text-[#0F3460]" />
                  <span className="text-sm font-medium">{t(key.toLowerCase() as Parameters<typeof t>[0])}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={goToStep2}
              className="w-full py-3 bg-[#0F3460] text-white rounded-[8px] font-medium mt-2"
            >
              {tc('next')}
            </button>

            <div className="flex items-center gap-3 my-2">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">{tc('or')}</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <NafathButton />
          </div>
        )}

        {/* ── Step 2 — Basic Details ── */}
        {step === 2 && (
          <form onSubmit={onStep2Submit} className="space-y-4">
            {isNafath && (
              <div className="flex items-center gap-2 rounded-[8px] bg-green-50 text-green-700 text-sm p-3">
                <ShieldCheck size={16} />
                موثّق عبر نفاذ الوطني
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
              <input
                className={`w-full border rounded-[8px] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460] ${
                  isNafath ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={isNafath}
                required
              />
            </div>

            {isNafath && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهوية</label>
                <input
                  className="w-full border border-blue-200 bg-blue-50 rounded-[8px] px-3 py-2.5 text-sm id-number ltr"
                  value={nafathNationalId}
                  readOnly
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm phone-number ltr focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                placeholder="05XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')} <span className="text-gray-400 text-xs">({tc('optional')})</span>
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm ltr focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm ltr focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              {!isNafath && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 rounded-[8px] text-sm font-medium hover:bg-gray-50"
                >
                  {tc('back')}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#0F3460] text-white rounded-[8px] text-sm font-medium disabled:opacity-50"
              >
                {loading ? tc('loading') : NEEDS_PLAN.has(accountType) ? tc('next') : t('createAccount')}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3 — Plan Selection ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">اختر الباقة المناسبة — يمكنك تغييرها لاحقاً</p>

            {/* Period toggle */}
            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-2">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingPeriod === 'MONTHLY' ? 'bg-white text-[#0F3460] shadow-sm' : 'text-gray-500'}`}
              >
                شهري
              </button>
              <button
                onClick={() => setBillingPeriod('YEARLY')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all relative ${billingPeriod === 'YEARLY' ? 'bg-white text-[#0F3460] shadow-sm' : 'text-gray-500'}`}
              >
                سنوي
                <span className="absolute -top-2 -left-1 bg-[#C9A84C] text-white text-[9px] px-1 py-0.5 rounded-full font-bold">
                  -{yearlyDiscount}%
                </span>
              </button>
            </div>

            {plansLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {plans.map((plan) => {
                  const price = billingPeriod === 'YEARLY' ? plan.priceYearly : plan.priceMonthly
                  const isSelected = selectedPlanId === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full text-right p-4 rounded-[8px] border-2 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F3460]">{plan.nameAr}</span>
                          {plan.isFeatured && (
                            <span className="text-[10px] bg-[#C9A84C] text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star size={8} fill="white" /> موصى بها
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {plan.maxCars === null ? 'سيارات غير محدودة' : `حتى ${plan.maxCars} سيارة`}
                          {plan.features.market && ' · Market'}
                          {plan.features.auctions && ' · مزادات'}
                        </div>
                      </div>
                      <div className="text-left">
                        {plan.isPublic ? (
                          <>
                            <span className="price-number font-mono font-bold text-[#C9A84C] ltr">
                              {Number(price).toFixed(0)}
                            </span>
                            <span className="text-gray-400 text-xs"> ر/{billingPeriod === 'YEARLY' ? 'سنة' : 'شهر'}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">تواصل معنا</span>
                        )}
                        <div className="text-xs text-green-600 mt-0.5">{plan.trialDays} يوم مجاناً</div>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-0 -right-0 opacity-0">&nbsp;</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-200 rounded-[8px] text-sm font-medium hover:bg-gray-50"
              >
                {tc('back')}
              </button>
              <button
                type="button"
                onClick={onStep3Submit}
                disabled={loading || !selectedPlanId}
                className="flex-1 py-3 bg-[#C9A84C] text-white rounded-[8px] text-sm font-semibold disabled:opacity-50"
              >
                {loading ? tc('loading') : 'ابدأ التجربة المجانية'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => submitForm(undefined, undefined)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              {tc('skip')} — سأختار لاحقاً
            </button>
          </div>
        )}

        <p className="text-sm text-center text-gray-500 mt-5">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-[#0F3460] font-medium">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
