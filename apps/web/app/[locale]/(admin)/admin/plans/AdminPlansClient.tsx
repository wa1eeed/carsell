'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import type { PlanWithFeatures, PlanFeatures } from '@/repositories/plan.repository'

interface Props { plans: PlanWithFeatures[] }

const DEFAULT_FEATURES: PlanFeatures = {
  market: false,
  auctions: false,
  api: false,
  reports: 'basic',
  support: 'email',
  customShowroom: true,
  teamMembers: 3,
}

export default function AdminPlansClient({ plans: initialPlans }: Props) {
  const router = useRouter()
  const [plans, setPlans] = useState(initialPlans)
  const [editing, setEditing] = useState<PlanWithFeatures | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Partial<PlanWithFeatures> & { features: PlanFeatures }>({
    features: DEFAULT_FEATURES,
  })
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setForm({ features: DEFAULT_FEATURES, isActive: true, isPublic: true, isFeatured: false, sortOrder: plans.length, trialDays: 14 })
    setEditing(null)
    setCreating(true)
  }

  function openEdit(plan: PlanWithFeatures) {
    setForm({ ...plan })
    setEditing(plan)
    setCreating(true)
  }

  async function savePlan() {
    setSaving(true)
    const url = editing ? `/api/v1/admin/plans/${editing.id}` : '/api/v1/admin/plans'
    const method = editing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json() as { plan?: PlanWithFeatures }
    setSaving(false)
    if (data.plan) {
      setCreating(false)
      router.refresh()
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return
    await fetch(`/api/v1/admin/plans/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function toggleActive(plan: PlanWithFeatures) {
    await fetch(`/api/v1/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !plan.isActive }),
    })
    router.refresh()
  }

  function setFeature<K extends keyof PlanFeatures>(key: K, value: PlanFeatures[K]) {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: value } }))
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0F3460]">إدارة الباقات</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#C9A84C] text-white px-4 py-2 rounded-[8px] text-sm font-medium"
        >
          <Plus size={16} /> باقة جديدة
        </button>
      </div>

      {/* Plans table */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-100">
            <tr>
              <th className="text-right p-4 font-medium text-gray-500">الباقة</th>
              <th className="text-right p-4 font-medium text-gray-500">شهري</th>
              <th className="text-right p-4 font-medium text-gray-500">سنوي</th>
              <th className="text-right p-4 font-medium text-gray-500">السيارات</th>
              <th className="text-right p-4 font-medium text-gray-500">المميزات</th>
              <th className="text-right p-4 font-medium text-gray-500">الحالة</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {plan.isFeatured && <Star size={14} className="text-[#C9A84C]" fill="currentColor" />}
                    <div>
                      <div className="font-semibold text-[#0F3460]">{plan.nameAr}</div>
                      <div className="text-gray-400 text-xs">{plan.name} · {plan.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="price-number font-mono ltr text-[#C9A84C]">
                    {Number(plan.priceMonthly).toFixed(0)}
                  </span>{' '}ريال
                </td>
                <td className="p-4">
                  <span className="price-number font-mono ltr text-[#C9A84C]">
                    {Number(plan.priceYearly).toFixed(0)}
                  </span>{' '}ريال
                </td>
                <td className="p-4 text-gray-600">
                  {plan.maxCars === null ? 'غير محدود' : plan.maxCars}
                </td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {plan.features.market && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Market</span>}
                    {plan.features.auctions && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">مزادات</span>}
                    {plan.features.api && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">API</span>}
                  </div>
                </td>
                <td className="p-4">
                  <button onClick={() => toggleActive(plan)} className={`text-xs px-2 py-1 rounded-full font-medium ${plan.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {plan.isActive ? 'نشط' : 'موقوف'}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(plan)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0F3460]">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deletePlan(plan.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[12px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#0F3460] mb-6">
              {editing ? 'تعديل الباقة' : 'باقة جديدة'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Basic fields */}
              {[
                { key: 'name',    label: 'الاسم (EN)', type: 'text' },
                { key: 'nameAr',  label: 'الاسم (AR)', type: 'text' },
                { key: 'slug',    label: 'Slug',        type: 'text' },
                { key: 'sortOrder', label: 'الترتيب',  type: 'number' },
                { key: 'priceMonthly', label: 'السعر الشهري (ريال)', type: 'number' },
                { key: 'priceYearly',  label: 'السعر السنوي (ريال)', type: 'number' },
                { key: 'maxCars',  label: 'حد السيارات (فارغ = ∞)', type: 'number' },
                { key: 'trialDays', label: 'أيام التجربة', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, unknown>)[key] as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value }))}
                    className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
                  />
                </div>
              ))}
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">الوصف (AR)</label>
                <textarea value={form.descriptionAr ?? ''} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#0F3460]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">الوصف (EN)</label>
                <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#0F3460]" />
              </div>
            </div>

            {/* Feature toggles */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">المميزات</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Booleans */}
                {(['market', 'auctions', 'api', 'customShowroom'] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.features[key] as boolean}
                      onChange={(e) => setFeature(key, e.target.checked)}
                      className="w-4 h-4 accent-[#C9A84C]"
                    />
                    <span className="text-sm text-gray-700">{{ market: 'Market', auctions: 'المزادات', api: 'API', customShowroom: 'صفحة مخصصة' }[key]}</span>
                  </label>
                ))}

                {/* Reports */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">التقارير</label>
                  <select value={form.features.reports} onChange={(e) => setFeature('reports', e.target.value as 'basic' | 'advanced' | 'full')} className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm">
                    <option value="basic">أساسية</option>
                    <option value="advanced">متقدمة</option>
                    <option value="full">كاملة</option>
                  </select>
                </div>

                {/* Support */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">الدعم</label>
                  <select value={form.features.support} onChange={(e) => setFeature('support', e.target.value as PlanFeatures['support'])} className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm">
                    <option value="email">بريد إلكتروني</option>
                    <option value="chat">بريد + شات</option>
                    <option value="priority">أولوية</option>
                    <option value="dedicated">مدير حساب</option>
                  </select>
                </div>

                {/* Team members */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">أعضاء الفريق (فارغ = ∞)</label>
                  <input
                    type="number"
                    value={form.features.teamMembers ?? ''}
                    onChange={(e) => setFeature('teamMembers', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Visibility toggles */}
            <div className="flex gap-4 mt-4">
              {(['isActive', 'isPublic', 'isFeatured'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] as boolean ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-[#C9A84C]"
                  />
                  <span className="text-sm text-gray-700">{{ isActive: 'نشط', isPublic: 'عام', isFeatured: 'موصى بها ⭐' }[key]}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">إلغاء</button>
              <button onClick={savePlan} disabled={saving} className="px-6 py-2 bg-[#0F3460] text-white rounded-[8px] text-sm font-medium disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
