'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Link2, Globe, Check, X, Copy, ExternalLink, Loader2,
  AlertCircle, CheckCircle2, Trash2, RefreshCw,
} from 'lucide-react'
import { ROOT_DOMAIN } from '@/lib/constants'
import { useOrigin } from '@/lib/hooks/use-origin'

interface DnsRecord { type: string; name: string; value: string }
interface DnsInstructions {
  aRecord:     DnsRecord
  cnameRecord: DnsRecord
  txtRecord:   DnsRecord
}

interface Props {
  slug:                 string | null
  showroomNumber:       number | null
  customDomain:         string | null
  customDomainVerified: boolean
}

export function SettingsClient({ slug, showroomNumber, customDomain, customDomainVerified }: Props) {
  const router = useRouter()

  return (
    <div className="max-w-3xl space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3460]">إعدادات المعرض</h1>
        <p className="text-gray-500 text-sm mt-1">الرابط العام والدومين المخصص</p>
      </div>

      <SlugSection slug={slug} onUpdate={() => router.refresh()} />
      <CustomDomainSection
        domain={customDomain}
        verified={customDomainVerified}
        onChange={() => router.refresh()}
      />
    </div>
  )
}

// ── Slug (public URL handle) ────────────────────────────────────────────────

function SlugSection({ slug, onUpdate }: { slug: string | null; onUpdate: () => void }) {
  const [value, setValue]   = useState(slug ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [saved, setSaved]   = useState(false)
  const [copied, setCopied] = useState(false)

  const origin    = useOrigin()
  const publicUrl = value ? `${origin}/${value}` : ''

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    const res  = await fetch('/api/v1/showroom/slug', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ slug: value }),
    })
    const data = await res.json() as { success?: boolean; error?: string }
    setSaving(false)
    if (!data.success) { setError(typeof data.error === 'string' ? data.error : 'حدث خطأ'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    onUpdate()
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={18} className="text-[#0F3460]" />
        <h2 className="font-bold text-[#0F3460]">الرابط العام للمعرض</h2>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        اختر اسماً مميزاً لمعرضك. سيكون رابطك العام بالشكلين:
      </p>

      {/* URL preview */}
      <div className="flex items-stretch gap-0 mb-2">
        <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-200 rounded-r-[8px] text-sm text-gray-500 ltr" dir="ltr">
          {ROOT_DOMAIN}/
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="my-showroom"
          className="flex-1 border border-gray-200 rounded-l-[8px] px-3 py-2 text-sm ltr font-mono focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
          dir="ltr"
        />
      </div>

      {error && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}

      {/* Two URL forms */}
      {slug && (
        <div className="bg-gray-50 rounded-[8px] p-3 mb-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16">رابط مباشر:</span>
            <span className="font-mono text-[#0F3460] ltr flex-1">{origin}/{slug}</span>
            <button onClick={() => { navigator.clipboard.writeText(`${origin}/${slug}`); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className="text-gray-400 hover:text-[#0F3460]">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
            <a href={`${origin}/${slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0F3460]">
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16">نطاق فرعي:</span>
            <span className="font-mono text-[#0F3460]/70 ltr flex-1">{slug}.{ROOT_DOMAIN}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !value || value === slug}
          className="bg-[#0F3460] text-white px-5 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          حفظ
        </button>
        {saved && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 size={14} /> تم الحفظ</span>}
      </div>
    </div>
  )
}

// ── Custom domain ───────────────────────────────────────────────────────────

function CustomDomainSection({
  domain,
  verified,
  onChange,
}: {
  domain: string | null
  verified: boolean
  onChange: () => void
}) {
  const [value, setValue]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [dns, setDns]         = useState<DnsInstructions | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')

  async function connect() {
    setSaving(true); setError(''); setDns(null)
    const res  = await fetch('/api/v1/showroom/domain', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ domain: value }),
    })
    const data = await res.json() as { success?: boolean; error?: string; dns?: DnsInstructions }
    setSaving(false)
    if (!data.success) { setError(typeof data.error === 'string' ? data.error : 'حدث خطأ'); return }
    if (data.dns) setDns(data.dns)
    onChange()
  }

  async function verify() {
    setVerifying(true); setVerifyMsg('')
    const res  = await fetch('/api/v1/showroom/domain/verify', { method: 'POST' })
    const data = await res.json() as { success?: boolean; verified?: boolean; error?: string }
    setVerifying(false)
    if (data.verified) { setVerifyMsg('✓ تم التحقق من الدومين بنجاح!'); onChange() }
    else setVerifyMsg(typeof data.error === 'string' ? data.error : 'لم يتم التحقق بعد')
  }

  async function remove() {
    if (!confirm('إزالة الدومين المخصص؟')) return
    await fetch('/api/v1/showroom/domain', { method: 'DELETE' })
    setDns(null); setValue('')
    onChange()
  }

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-[#0F3460]" />
        <h2 className="font-bold text-[#0F3460]">دومين مخصص</h2>
        {domain && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {verified ? '✓ موثّق' : 'بانتظار التحقق'}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        اربط دومينك الخاص (مثل <span className="font-mono ltr">mydealership.com</span>) ليصبح هو رابط معرضك بدلاً من رابط المنصة.
      </p>

      {/* Current domain */}
      {domain ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-gray-50 rounded-[8px] px-3 py-2.5">
            <Globe size={14} className={verified ? 'text-green-500' : 'text-amber-500'} />
            <span className="font-mono text-sm flex-1 ltr">{domain}</span>
            {verified && (
              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0F3460]">
                <ExternalLink size={14} />
              </a>
            )}
            <button onClick={remove} className="text-gray-400 hover:text-red-500" title="إزالة">
              <Trash2 size={14} />
            </button>
          </div>

          {!verified && (
            <DomainVerificationGuide
              domain={domain}
              dns={dns}
              onVerify={verify}
              verifying={verifying}
              verifyMsg={verifyMsg}
            />
          )}
        </div>
      ) : (
        // Connect new domain
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.toLowerCase().trim())}
              placeholder="mydealership.com"
              className="flex-1 border border-gray-200 rounded-[8px] px-3 py-2 text-sm ltr font-mono focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
              dir="ltr"
            />
            <button
              onClick={connect}
              disabled={saving || !value}
              className="bg-[#0F3460] text-white px-5 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              ربط
            </button>
          </div>
          {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}

          {dns && (
            <DomainVerificationGuide domain={value} dns={dns} onVerify={verify} verifying={verifying} verifyMsg={verifyMsg} />
          )}
        </div>
      )}
    </div>
  )
}

// ── DNS instructions guide ──────────────────────────────────────────────────

function DomainVerificationGuide({
  domain,
  dns,
  onVerify,
  verifying,
  verifyMsg,
}: {
  domain: string
  dns: DnsInstructions | null
  onVerify: () => void
  verifying: boolean
  verifyMsg: string
}) {
  // Default DNS records (when dns not freshly returned, show standard guidance)
  const records: { label: string; rec: DnsRecord }[] = dns
    ? [
        { label: 'ربط الدومين الرئيسي (Apex)', rec: dns.aRecord },
        { label: 'ربط www', rec: dns.cnameRecord },
        { label: 'إثبات الملكية', rec: dns.txtRecord },
      ]
    : []

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-[8px] p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-800">أضف هذه السجلات في إعدادات DNS لدى مزوّد الدومين</p>
          <p className="text-xs text-gray-500 mt-0.5">
            (مثل GoDaddy، Cloudflare، Namecheap) — قد يستغرق التفعيل حتى ساعة.
          </p>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-2">
          {records.map(({ label, rec }) => (
            <div key={rec.type + rec.name} className="bg-white rounded-[6px] border border-gray-100 p-2.5">
              <div className="text-[10px] text-gray-400 mb-1">{label}</div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono ltr" dir="ltr">
                <CopyField label="Type"  value={rec.type} />
                <CopyField label="Name"  value={rec.name} />
                <CopyField label="Value" value={rec.value} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onVerify}
          disabled={verifying}
          className="bg-[#C9A84C] text-white px-4 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {verifying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          تحقّق الآن
        </button>
        {verifyMsg && (
          <span className={`text-sm ${verifyMsg.startsWith('✓') ? 'text-green-600' : 'text-amber-600'}`}>
            {verifyMsg}
          </span>
        )}
      </div>
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <div className="text-[9px] text-gray-400 mb-0.5 font-sans">{label}</div>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200) }}
        className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 w-full text-left transition-colors group"
        title="نسخ"
      >
        <span className="truncate flex-1">{value}</span>
        {copied ? <Check size={10} className="text-green-500 shrink-0" /> : <Copy size={10} className="text-gray-300 group-hover:text-gray-500 shrink-0" />}
      </button>
    </div>
  )
}
