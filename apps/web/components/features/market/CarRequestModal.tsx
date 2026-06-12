'use client'

import { useState } from 'react'
import { X, CalendarClock, HandCoins, ShoppingCart, CheckCircle2, Loader2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'

type ReqType = 'RESERVATION' | 'SOUM_OFFER' | 'PURCHASE'

interface Props {
  carId:     string
  carTitle:  string
  type:      ReqType
  onClose:   () => void
}

const META: Record<ReqType, { title: string; cta: string; icon: typeof CalendarClock }> = {
  RESERVATION: { title: 'حجز السيارة',   cta: 'إرسال طلب الحجز',   icon: CalendarClock },
  SOUM_OFFER:  { title: 'تقديم عرض سعر', cta: 'إرسال العرض',        icon: HandCoins },
  PURCHASE:    { title: 'طلب شراء',       cta: 'إرسال طلب الشراء',   icon: ShoppingCart },
}

export function CarRequestModal({ carId, carTitle, type, onClose }: Props) {
  const meta = META[type]
  const Icon = meta.icon
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [offer, setOffer]     = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch(`/api/v1/cars/${carId}/request`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type,
        buyerName:  name,
        buyerPhone: phone,
        offerAmount: type === 'SOUM_OFFER' && offer ? Number(offer) : undefined,
        message:    message || undefined,
      }),
    })
    const data = await res.json() as { success?: boolean; error?: string }
    setSaving(false)
    if (!data.success) { setError(typeof data.error === 'string' ? data.error : 'حدث خطأ'); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-[12px] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#0F3460] flex items-center gap-2">
            <Icon size={18} /> {meta.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-500 mb-3" />
            <p className="font-bold text-[#0F3460] text-lg">تم إرسال طلبك بنجاح!</p>
            <p className="text-sm text-gray-500 mt-1">سيتواصل معك المعرض قريباً.</p>
            <button onClick={onClose} className="mt-5 bg-[#0F3460] text-white px-6 py-2.5 rounded-[8px] font-medium">إغلاق</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <p className="text-sm text-gray-500">{carTitle}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>

            {type === 'SOUM_OFFER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ العرض (ريال)</label>
                <input type="number" value={offer} onChange={(e) => setOffer(e.target.value)} required min={1}
                  className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm ltr font-mono focus:outline-none focus:ring-1 focus:ring-[#0F3460]" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة <span className="text-gray-400 text-xs">(اختياري)</span></label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={500}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#0F3460]" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#C9A84C] text-white py-3 rounded-[8px] font-semibold hover:bg-[#b8973b] disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />} {meta.cta}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
