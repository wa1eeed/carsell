'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, Info, CheckCircle } from 'lucide-react'
import type { PlatformSetting } from '@prisma/client'

interface Props { settings: PlatformSetting[] }

// Keys that appear in the UI with labels
const TAP_KEYS = [
  { key: 'tap_env',        label: 'البيئة',           type: 'select', options: ['test', 'live'], isSecret: false },
  { key: 'tap_secret_key', label: 'Secret Key',        type: 'text',   isSecret: true  },
  { key: 'tap_public_key', label: 'Public Key',        type: 'text',   isSecret: true  },
  { key: 'tap_merchant_id',label: 'Merchant ID',       type: 'text',   isSecret: false },
  { key: 'tap_webhook_secret', label: 'Webhook Secret', type: 'text',  isSecret: true  },
]

const PLATFORM_KEYS = [
  { key: 'platform_name_ar',        label: 'اسم المنصة (AR)',                  type: 'text',   isSecret: false },
  { key: 'platform_name_en',        label: 'اسم المنصة (EN)',                  type: 'text',   isSecret: false },
  { key: 'support_email',           label: 'بريد الدعم',                       type: 'text',   isSecret: false },
  { key: 'support_phone',           label: 'هاتف الدعم',                       type: 'text',   isSecret: false },
]

const STORAGE_KEYS = [
  { key: 'media_delete_after_days', label: 'حذف صور السيارات المباعة بعد (أيام)', type: 'number', isSecret: false },
]

function maskSecret(val: string): string {
  if (val.length <= 8) return '••••••••'
  return val.slice(0, 7) + '••••' + val.slice(-4)
}

export default function AdminSettingsClient({ settings: initialSettings }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map((s) => [s.key, s.value])),
  )
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setValue(key: string, val: string) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  function toggleShow(key: string) {
    setShown((s) => ({ ...s, [key]: !s[key] }))
  }

  async function saveSection(keys: { key: string; isSecret: boolean }[]) {
    setSaving(true)
    await fetch('/api/v1/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: keys.map(({ key, isSecret }) => ({
          key,
          value: values[key] ?? '',
          isSecret,
        })),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  function SettingRow({ skey, label, type, isSecret, options }: {
    skey: string; label: string; type: string; isSecret: boolean; options?: string[]
  }) {
    const val = values[skey] ?? ''
    const isShown = shown[skey] ?? false

    return (
      <div className="flex items-center gap-4">
        <label className="w-48 text-sm text-gray-600 shrink-0">{label}</label>
        <div className="flex-1 relative">
          {type === 'select' ? (
            <select
              value={val}
              onChange={(e) => setValue(skey, e.target.value)}
              className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
            >
              {options?.map((o) => (
                <option key={o} value={o}>
                  {o === 'test' ? 'تجريبي (Test)' : 'إنتاج (Live)'}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={isSecret && !isShown ? 'password' : 'text'}
              value={val}
              onChange={(e) => setValue(skey, e.target.value)}
              className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460] ltr font-mono"
              placeholder={isSecret ? '••••••••••••••••' : ''}
            />
          )}
          {isSecret && val && (
            <button
              type="button"
              onClick={() => toggleShow(skey)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isShown ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
        {isSecret && <span className="text-xs text-orange-500 flex items-center gap-1"><Info size={10} /> مشفر</span>}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0F3460]">إعدادات المنصة</h1>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> تم الحفظ
          </span>
        )}
      </div>

      {/* Tap.company section */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#0F3460]">بوابة الدفع — Tap.company</h2>
            <p className="text-xs text-gray-400 mt-0.5">مفاتيح API الخاصة بحساب Tap</p>
          </div>
          <button
            onClick={() => saveSection(TAP_KEYS)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0F3460] text-white px-4 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50"
          >
            <Save size={14} /> حفظ
          </button>
        </div>

        <div className="space-y-4">
          {TAP_KEYS.map((k) => (
            <SettingRow key={k.key} skey={k.key} label={k.label} type={k.type} isSecret={k.isSecret} options={(k as { options?: string[] }).options} />
          ))}
        </div>

        {/* Current env indicator */}
        <div className={`mt-4 p-3 rounded-[8px] text-sm flex items-center gap-2 ${
          values.tap_env === 'live' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${values.tap_env === 'live' ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`} />
          {values.tap_env === 'live' ? '⚠️ البيئة: إنتاج (Live) — المعاملات حقيقية' : 'البيئة: تجريبي (Test) — المعاملات وهمية'}
        </div>
      </div>

      {/* Platform info */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#0F3460]">معلومات المنصة</h2>
            <p className="text-xs text-gray-400 mt-0.5">البيانات العامة للمنصة</p>
          </div>
          <button
            onClick={() => saveSection(PLATFORM_KEYS)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0F3460] text-white px-4 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50"
          >
            <Save size={14} /> حفظ
          </button>
        </div>
        <div className="space-y-4">
          {PLATFORM_KEYS.map((k) => (
            <SettingRow key={k.key} skey={k.key} label={k.label} type={k.type} isSecret={k.isSecret} />
          ))}
        </div>
      </div>

      {/* Storage & Cleanup */}
      <div className="bg-white rounded-[12px] border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#0F3460]">التخزين والتنظيف التلقائي</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              صور وفيديوهات السيارات المباعة تُحذف تلقائياً بعد المدة المحددة.
              ملفات الوثائق (PDF، فواتير) لا تُحذف أبداً.
            </p>
          </div>
          <button
            onClick={() => saveSection(STORAGE_KEYS)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0F3460] text-white px-4 py-2 rounded-[8px] text-sm font-medium disabled:opacity-50"
          >
            <Save size={14} /> حفظ
          </button>
        </div>
        <div className="space-y-4">
          {STORAGE_KEYS.map((k) => (
            <SettingRow key={k.key} skey={k.key} label={k.label} type={k.type} isSecret={k.isSecret} />
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 rounded-[8px] text-xs text-amber-700 flex items-start gap-2">
          <Info size={12} className="mt-0.5 shrink-0" />
          <div>
            <strong>مجلد الميديا (media/):</strong> صور وفيديوهات السيارة — يُحذف تلقائياً بعد البيع أو الإخراج<br />
            <strong>مجلد الوثائق (docs/):</strong> فواتير وملفات PDF — محفوظ دائماً
          </div>
        </div>
      </div>
    </div>
  )
}
