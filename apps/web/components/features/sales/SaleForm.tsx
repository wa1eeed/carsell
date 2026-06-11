'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { computeVat } from '@/services/tax.service'
import { formatNumber } from '@/lib/format'

type PaymentMethod = 'CASH' | 'FINANCING' | 'TRADE_IN' | 'MIXED'
type Condition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'

interface Props {
  carId: string
  carTitle: string
  carType: 'NEW' | 'USED' | 'USED_QUALIFIED'
  purchasePrice: number
  extraCosts: number
  defaultSellPrice: number
  profitMarginApproved: boolean
  marketEnabled: boolean
}

const METHODS: PaymentMethod[] = ['CASH', 'FINANCING', 'TRADE_IN', 'MIXED']
const CONDITIONS: Condition[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR']

export function SaleForm({
  carId,
  carTitle,
  carType,
  purchasePrice,
  extraCosts,
  defaultSellPrice,
  profitMarginApproved,
  marketEnabled,
}: Props) {
  const t = useTranslations('sale')
  const tc = useTranslations('common')
  const tcar = useTranslations('car.fields')
  const locale = useLocale()
  const router = useRouter()
  const prefix = locale === 'ar' ? '' : '/en'

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [email, setEmail] = useState('')
  const [sellPrice, setSellPrice] = useState(String(defaultSellPrice || ''))
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')

  // financing
  const [finProvider, setFinProvider] = useState('')
  const [finAmount, setFinAmount] = useState('')
  const [finFees, setFinFees] = useState('')

  // trade-in
  const [tiYear, setTiYear] = useState('')
  const [tiVin, setTiVin] = useState('')
  const [tiCondition, setTiCondition] = useState<Condition>('GOOD')
  const [tiEstimated, setTiEstimated] = useState('')
  const [tiAgreed, setTiAgreed] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ saleId: string } | null>(null)

  const showFinancing = method === 'FINANCING' || method === 'MIXED'
  const showTradeIn = method === 'TRADE_IN' || method === 'MIXED'

  // Live breakdown (server recalculates authoritatively on submit)
  const vat = computeVat({
    carType,
    profitMarginApproved,
    sellPrice: Number(sellPrice) || 0,
    purchasePrice,
    extraCosts,
  })
  const financingFees = showFinancing ? Number(finFees) || 0 : 0
  const customerPayable = vat.customerTotal + financingFees

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        buyer: { name, phone, nationalId: nationalId || undefined, email: email || undefined },
        sellPrice: Number(sellPrice),
        paymentMethod: method,
        notes: notes || undefined,
        ...(showFinancing && finProvider
          ? { financing: { provider: finProvider, amount: Number(finAmount), fees: Number(finFees) || 0 } }
          : {}),
        ...(showTradeIn
          ? {
              tradeIn: {
                year: tiYear ? Number(tiYear) : undefined,
                vin: tiVin || undefined,
                condition: tiCondition,
                estimatedValue: Number(tiEstimated),
                agreedValue: Number(tiAgreed),
              },
            }
          : {}),
      }
      const res = await fetch(`/api/v1/sales/${carId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message ?? tc('error'))
        return
      }
      setDone({ saleId: json.data.saleId })
    } catch {
      setError(tc('error'))
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="cl-card max-w-md text-center space-y-4 py-8">
        <CheckCircle2 size={40} className="mx-auto text-cl-success" />
        <p className="font-medium">{tc('success')}</p>
        <button className="btn-primary w-full justify-center" onClick={() => router.push(`${prefix}/inventory/${carId}`)}>
          {tc('close')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {error && <p className="text-sm text-cl-danger">{error}</p>}

        {/* Buyer */}
        <section className="cl-card space-y-4">
          <h3 className="font-semibold">{t('buyer')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('buyerName')}><input className="cl-input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label={t('buyerPhone')}><input className="cl-input phone-number" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
            <Field label={t('buyerNationalId')}><input className="cl-input id-number" value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></Field>
            <Field label="البريد الإلكتروني"><input type="email" className="cl-input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          </div>
        </section>

        {/* Sale details */}
        <section className="cl-card space-y-4">
          <h3 className="font-semibold">{carTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('sellPrice')}>
              <input className="cl-input price-number" inputMode="numeric" value={sellPrice} onChange={(e) => setSellPrice(e.target.value.replace(/\D/g, ''))} required />
            </Field>
            <Field label={t('paymentMethod')}>
              <select className="cl-input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{t(m)}</option>)}
              </select>
            </Field>
          </div>

          {showFinancing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-input bg-cl-gray-50 p-3">
              <Field label="جهة التمويل"><input className="cl-input" value={finProvider} onChange={(e) => setFinProvider(e.target.value)} /></Field>
              <Field label="مبلغ التمويل"><input className="cl-input price-number" inputMode="numeric" value={finAmount} onChange={(e) => setFinAmount(e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="رسوم التمويل"><input className="cl-input price-number" inputMode="numeric" value={finFees} onChange={(e) => setFinFees(e.target.value.replace(/\D/g, ''))} /></Field>
            </div>
          )}

          {showTradeIn && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-input bg-cl-gray-50 p-3">
              <Field label={tcar('year')}><input className="cl-input price-number" inputMode="numeric" value={tiYear} onChange={(e) => setTiYear(e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label={tcar('vin')}><input className="cl-input vin" value={tiVin} onChange={(e) => setTiVin(e.target.value)} /></Field>
              <Field label="الحالة">
                <select className="cl-input" value={tiCondition} onChange={(e) => setTiCondition(e.target.value as Condition)}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="القيمة التقديرية"><input className="cl-input price-number" inputMode="numeric" value={tiEstimated} onChange={(e) => setTiEstimated(e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="القيمة المتفق عليها"><input className="cl-input price-number" inputMode="numeric" value={tiAgreed} onChange={(e) => setTiAgreed(e.target.value.replace(/\D/g, ''))} /></Field>
            </div>
          )}

          <Field label={tc('notes')}>
            <textarea className="cl-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </section>
      </div>

      {/* Breakdown sidebar */}
      <aside>
        <div className="cl-card sticky top-6 space-y-3">
          <h3 className="font-semibold text-sm">{t('breakdown')}</h3>
          <Row label={t('sellPrice')} value={formatNumber(Number(sellPrice) || 0, locale)} />
          <Row
            label={`${t('vatAmount')} (${vat.method === 'PROFIT_MARGIN' ? 'هامش' : 'كامل'})`}
            value={formatNumber(vat.vatAmount, locale)}
          />
          {financingFees > 0 && <Row label="رسوم التمويل" value={formatNumber(financingFees, locale)} />}
          <hr className="border-cl-gray-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm">إجمالي على المشتري</span>
            <span className="price-number font-semibold text-cl-accent">{formatNumber(customerPayable, locale)}</span>
          </div>
          <Row label={t('netProfit')} value={formatNumber(vat.netProfit, locale)} valueClass={vat.netProfit >= 0 ? 'text-cl-success' : 'text-cl-danger'} />
          {marketEnabled && <Row label="عمولة المنصة" value="—" />}

          <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : t('registerSale')}
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

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-cl-gray-600">{label}</span>
      <span className={`price-number ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
