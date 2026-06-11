'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, FileText,
  ExternalLink, User, Building2, Loader2,
} from 'lucide-react'
import { formatShowroomId } from '@/lib/format'

type KycRequest = {
  id: string
  name: string
  email: string
  phone: string | null
  nationalId: string | null
  idType: string | null
  accountType: string
  kycStatus: string
  kycSubmittedAt: Date | null
  kycDocFront: string | null
  kycDocBack: string | null
  kycRejectReason: string | null
  nafathVerified: boolean
  showroom: { id: string; name: string; city: string | null; showroomNumber: number | null }
}

interface Props {
  requests:     KycRequest[]
  counts:       { pending: number; approved: number; rejected: number }
  activeStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const TABS = [
  { key: 'PENDING',  label: 'قيد المراجعة', icon: Clock,        color: 'text-amber-600' },
  { key: 'APPROVED', label: 'موثّق',        icon: CheckCircle2, color: 'text-green-600' },
  { key: 'REJECTED', label: 'مرفوض',        icon: XCircle,      color: 'text-red-600' },
] as const

export default function AdminKycClient({ requests, counts, activeStatus }: Props) {
  const router = useRouter()
  const [busy, setBusy]       = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason]   = useState('')

  async function approve(userId: string) {
    setBusy(userId)
    await fetch(`/api/v1/admin/kyc/${userId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'approve' }),
    })
    setBusy(null)
    router.refresh()
  }

  async function reject(userId: string) {
    if (!reason.trim()) return
    setBusy(userId)
    await fetch(`/api/v1/admin/kyc/${userId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'reject', reason }),
    })
    setBusy(null); setRejecting(null); setReason('')
    router.refresh()
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">طلبات التحقق من الهوية (KYC)</h1>
        <p className="text-gray-500 text-sm mt-1">مراجعة وتوثيق هويات أصحاب المعارض</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const Icon  = tab.icon
          const count = tab.key === 'PENDING' ? counts.pending : tab.key === 'APPROVED' ? counts.approved : counts.rejected
          const active = activeStatus === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/admin/kyc?status=${tab.key}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-all border ${
                active ? 'bg-[#0F3460] text-white border-[#0F3460]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={15} className={active ? 'text-white' : tab.color} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Requests */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-gray-100 p-12 text-center text-gray-400">
          <ShieldCheck size={36} className="mx-auto mb-3 text-gray-300" />
          لا توجد طلبات في هذه الحالة
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-[12px] border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                {/* User info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#0F3460]/10 rounded-full flex items-center justify-center">
                      <User size={18} className="text-[#0F3460]" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{req.name}</div>
                      <div className="text-xs text-gray-400">{req.email}</div>
                    </div>
                    {req.nafathVerified && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">نفاذ ✓</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <Info label="رقم الهوية" value={req.nationalId} mono />
                    <Info label="الجوال" value={req.phone} mono />
                    <Info label="نوع الحساب" value={accountTypeAr(req.accountType)} />
                    <Info label="المعرض" value={req.showroom?.name} />
                  </div>

                  {req.showroom?.showroomNumber && (
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <Building2 size={12} /> {formatShowroomId(req.showroom.showroomNumber)}
                      {req.showroom.city && ` · ${req.showroom.city}`}
                    </div>
                  )}

                  {/* Documents */}
                  {(req.kycDocFront || req.kycDocBack) && (
                    <div className="flex gap-2 mt-3">
                      {req.kycDocFront && <DocLink url={req.kycDocFront} label="الهوية - أمامي" />}
                      {req.kycDocBack  && <DocLink url={req.kycDocBack}  label="الهوية - خلفي" />}
                    </div>
                  )}

                  {req.kycRejectReason && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-[8px] px-3 py-2">
                      سبب الرفض: {req.kycRejectReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {activeStatus === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0 w-32">
                    <button
                      onClick={() => approve(req.id)}
                      disabled={busy === req.id}
                      className="flex items-center justify-center gap-1.5 bg-green-500 text-white px-3 py-2 rounded-[8px] text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {busy === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      قبول
                    </button>
                    <button
                      onClick={() => setRejecting(rejecting === req.id ? null : req.id)}
                      className="flex items-center justify-center gap-1.5 border border-red-200 text-red-500 px-3 py-2 rounded-[8px] text-sm font-medium hover:bg-red-50"
                    >
                      <XCircle size={14} /> رفض
                    </button>
                  </div>
                )}
              </div>

              {/* Reject reason input */}
              {rejecting === req.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="سبب الرفض..."
                    className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                  />
                  <button
                    onClick={() => reject(req.id)}
                    disabled={!reason.trim() || busy === req.id}
                    className="bg-red-500 text-white px-4 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50"
                  >
                    تأكيد الرفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-gray-800 ${mono ? 'font-mono ltr' : ''}`}>{value ?? '—'}</div>
    </div>
  )
}

function DocLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-[6px] transition-colors"
    >
      <FileText size={12} /> {label} <ExternalLink size={10} />
    </a>
  )
}

function accountTypeAr(t: string): string {
  return { INDIVIDUAL: 'فرد', SHOWROOM: 'معرض', AGENCY: 'وكالة', COMPANY: 'شركة' }[t] ?? t
}
