'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// ── Types ─────────────────────────────────────────────────────────────────────

type BodyType       = 'SUV' | 'SEDAN' | 'PICKUP' | 'COUPE' | 'HATCHBACK' | 'VAN' | 'CONVERTIBLE' | 'WAGON'
type FuelType       = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
type Transmission   = 'AUTOMATIC' | 'MANUAL'

const BODY_TYPE_LABELS: Record<BodyType, string> = {
  SUV:         'SUV',
  SEDAN:       'سيدان',
  PICKUP:      'بيك أب',
  COUPE:       'كوبيه',
  HATCHBACK:   'هاتشباك',
  VAN:         'فان',
  CONVERTIBLE: 'كبريوليه',
  WAGON:       'واغن',
}

const FUEL_LABELS: Record<FuelType, string> = {
  PETROL:   'بنزين',
  DIESEL:   'ديزل',
  HYBRID:   'هايبرد',
  ELECTRIC: 'كهربائي',
}

const TRANSMISSION_LABELS: Record<Transmission, string> = {
  AUTOMATIC: 'أوتوماتيك',
  MANUAL:    'يدوي',
}

const BODY_TYPES        = Object.keys(BODY_TYPE_LABELS) as BodyType[]
const FUEL_TYPES        = Object.keys(FUEL_LABELS)       as FuelType[]
const TRANSMISSION_TYPES = Object.keys(TRANSMISSION_LABELS) as Transmission[]

interface Brand {
  id: string
  nameAr: string
  nameEn: string
  logoUrl: string | null
  isActive: boolean
  _count: { categories: number }
}

interface Category {
  id: string
  brandId: string
  nameAr: string
  nameEn: string
  bodyType: BodyType
  fuelTypes: FuelType[]
  transmissions: Transmission[]
  isActive: boolean
  brand: { id: string; nameAr: string; nameEn: string }
  _count: { models: number }
}

interface Model {
  id: string
  categoryId: string
  name: string
  yearStart: number | null
  yearEnd: number | null
  isActive: boolean
  category: {
    id: string
    nameAr: string
    nameEn: string
    brand: { id: string; nameAr: string; nameEn: string }
  }
}

type Tab = 'brands' | 'categories' | 'models'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json() as { success: boolean; data?: T; error?: unknown }
  if (!json.success) {
    const msg = typeof json.error === 'string' ? json.error : 'حدث خطأ'
    throw new Error(msg)
  }
  return json.data as T
}

// ── Chip (multi-select) ───────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label,
  options,
  labels,
  selected,
  onChange,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  selected: T[]
  onChange: (next: T[]) => void
}) {
  function toggle(v: T) {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  }
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                active
                  ? 'bg-[#0F3460] text-white border-[#0F3460]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#0F3460] hover:text-[#0F3460]'
              }`}
            >
              {labels[opt]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminCatalogClient() {
  const [tab, setTab] = useState<Tab>('brands')

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#0F3460] rounded-[8px] flex items-center justify-center">
          <Tag size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0F3460]">براندات السيارات</h1>
          <p className="text-sm text-gray-500">إدارة الماركات والفئات والموديلات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-[10px] w-fit">
        {([
          { key: 'brands',     label: 'الماركات'  },
          { key: 'categories', label: 'الفئات'    },
          { key: 'models',     label: 'الموديلات' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-[8px] text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-[#0F3460] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'brands'     && <BrandsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'models'     && <ModelsTab />}
    </div>
  )
}

// ── Brands Tab ────────────────────────────────────────────────────────────────

function BrandsTab() {
  const [brands, setBrands]         = useState<Brand[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editItem, setEditItem]     = useState<Brand | null>(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [form, setForm]             = useState({ nameAr: '', nameEn: '', logoUrl: '' })
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<Brand[]>('/api/v1/admin/catalog/brands')
      setBrands(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في التحميل')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function openCreate() {
    setForm({ nameAr: '', nameEn: '', logoUrl: '' })
    setEditItem(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(b: Brand) {
    setForm({ nameAr: b.nameAr, nameEn: b.nameEn, logoUrl: b.logoUrl ?? '' })
    setEditItem(b)
    setShowForm(true)
    setError('')
  }

  async function save() {
    if (!form.nameAr.trim() || !form.nameEn.trim()) { setError('الاسم العربي والإنجليزي مطلوبان'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(),
        ...(form.logoUrl.trim() ? { logoUrl: form.logoUrl.trim() } : {}),
        ...(editItem ? { id: editItem.id } : {}),
      }
      await apiFetch('/api/v1/admin/catalog/brands', { method: editItem ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setShowForm(false); void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ')
    } finally { setSaving(false) }
  }

  async function toggleActive(b: Brand) {
    try {
      await apiFetch('/api/v1/admin/catalog/brands', { method: 'PATCH', body: JSON.stringify({ id: b.id, isActive: !b.isActive }) })
      void load()
    } catch { /* silent */ }
  }

  async function remove(b: Brand) {
    try {
      await apiFetch('/api/v1/admin/catalog/brands', { method: 'DELETE', body: JSON.stringify({ id: b.id }) })
      toast.success('تم حذف الماركة بنجاح')
      void load()
    } catch { toast.error('فشل الحذف، حاول مرة أخرى') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{brands.length} ماركة</span>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="p-2 hover:bg-gray-100 rounded-[8px] text-gray-400"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#C9A84C] text-white px-4 py-2 rounded-[8px] text-sm font-medium">
            <Plus size={14} /> ماركة جديدة
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-[12px] p-4 space-y-3">
          <h3 className="font-semibold text-[#0F3460] text-sm">{editItem ? 'تعديل الماركة' : 'ماركة جديدة'}</h3>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم بالعربي <span className="text-red-400">*</span></label>
              <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="تويوتا" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم بالإنجليزي <span className="text-red-400">*</span></label>
              <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="Toyota" dir="ltr" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">رابط الشعار (اختياري)</label>
              <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="https://..." dir="ltr" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">إلغاء</button>
            <button onClick={() => void save()} disabled={saving} className="px-5 py-2 bg-[#0F3460] text-white rounded-[8px] text-sm font-medium disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">لا توجد ماركات بعد</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr>
                <th className="text-right p-4 font-medium text-gray-500">الاسم</th>
                <th className="text-right p-4 font-medium text-gray-500">الإنجليزي</th>
                <th className="text-right p-4 font-medium text-gray-500">الفئات</th>
                <th className="text-right p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-[#0F3460]">{b.nameAr}</td>
                  <td className="p-4 text-gray-500" dir="ltr">{b.nameEn}</td>
                  <td className="p-4 text-gray-600">{b._count.categories}</td>
                  <td className="p-4">
                    <button onClick={() => void toggleActive(b)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${b.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {b.isActive ? 'نشط' : 'موقوف'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0F3460]"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(b)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الماركة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => { if (deleteTarget) void remove(deleteTarget); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Categories Tab ────────────────────────────────────────────────────────────

type CategoryForm = {
  brandId: string
  nameAr: string
  nameEn: string
  bodyType: BodyType
  fuelTypes: FuelType[]
  transmissions: Transmission[]
}

const DEFAULT_CAT_FORM: CategoryForm = {
  brandId: '', nameAr: '', nameEn: '', bodyType: 'SEDAN', fuelTypes: [], transmissions: [],
}

function CategoriesTab() {
  const [brands, setBrands]               = useState<Brand[]>([])
  const [categories, setCategories]       = useState<Category[]>([])
  const [filterBrandId, setFilterBrandId] = useState('')
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editItem, setEditItem]           = useState<Category | null>(null)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [form, setForm]                   = useState<CategoryForm>(DEFAULT_CAT_FORM)
  const [deleteTarget, setDeleteTarget]   = useState<Category | null>(null)

  const loadBrands = useCallback(async () => {
    const data = await apiFetch<Brand[]>('/api/v1/admin/catalog/brands')
    setBrands(data)
  }, [])

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const url = filterBrandId
        ? `/api/v1/admin/catalog/categories?brandId=${filterBrandId}`
        : '/api/v1/admin/catalog/categories'
      const data = await apiFetch<Category[]>(url)
      setCategories(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في التحميل')
    } finally { setLoading(false) }
  }, [filterBrandId])

  useEffect(() => { void loadBrands() }, [loadBrands])
  useEffect(() => { void loadCategories() }, [loadCategories])

  function openCreate() {
    setForm({ ...DEFAULT_CAT_FORM, brandId: filterBrandId || (brands[0]?.id ?? '') })
    setEditItem(null); setShowForm(true); setError('')
  }

  function openEdit(c: Category) {
    setForm({ brandId: c.brandId, nameAr: c.nameAr, nameEn: c.nameEn, bodyType: c.bodyType, fuelTypes: c.fuelTypes, transmissions: c.transmissions })
    setEditItem(c); setShowForm(true); setError('')
  }

  async function save() {
    if (!form.brandId || !form.nameAr.trim() || !form.nameEn.trim()) { setError('جميع الحقول الأساسية مطلوبة'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        brandId: form.brandId, nameAr: form.nameAr.trim(), nameEn: form.nameEn.trim(),
        bodyType: form.bodyType, fuelTypes: form.fuelTypes, transmissions: form.transmissions,
        ...(editItem ? { id: editItem.id } : {}),
      }
      await apiFetch('/api/v1/admin/catalog/categories', { method: editItem ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setShowForm(false); void loadCategories()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ')
    } finally { setSaving(false) }
  }

  async function toggleActive(c: Category) {
    try {
      await apiFetch('/api/v1/admin/catalog/categories', { method: 'PATCH', body: JSON.stringify({ id: c.id, isActive: !c.isActive }) })
      void loadCategories()
    } catch { /* silent */ }
  }

  async function remove(c: Category) {
    try {
      await apiFetch('/api/v1/admin/catalog/categories', { method: 'DELETE', body: JSON.stringify({ id: c.id }) })
      toast.success('تم حذف الفئة بنجاح')
      void loadCategories()
    } catch { toast.error('فشل الحذف، حاول مرة أخرى') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <select value={filterBrandId} onChange={(e) => setFilterBrandId(e.target.value)}
          className="border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460] bg-white">
          <option value="">كل الماركات</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => void loadCategories()} className="p-2 hover:bg-gray-100 rounded-[8px] text-gray-400"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#C9A84C] text-white px-4 py-2 rounded-[8px] text-sm font-medium">
            <Plus size={14} /> فئة جديدة
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-[12px] p-4 space-y-4">
          <h3 className="font-semibold text-[#0F3460] text-sm">{editItem ? 'تعديل الفئة' : 'فئة جديدة'}</h3>
          {error && <p className="text-red-500 text-xs">{error}</p>}

          {/* Row 1: brand, bodyType */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الماركة <span className="text-red-400">*</span></label>
              <select value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]">
                <option value="">اختر الماركة</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نوع الهيكل <span className="text-red-400">*</span></label>
              <select value={form.bodyType} onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value as BodyType }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]">
                {BODY_TYPES.map((bt) => <option key={bt} value={bt}>{BODY_TYPE_LABELS[bt]}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم بالعربي <span className="text-red-400">*</span></label>
              <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="كامري" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم بالإنجليزي <span className="text-red-400">*</span></label>
              <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="Camry" dir="ltr" />
            </div>
          </div>

          {/* Row 3: multi-selects */}
          <div className="grid grid-cols-2 gap-4">
            <ChipGroup
              label="أنواع الوقود"
              options={FUEL_TYPES}
              labels={FUEL_LABELS}
              selected={form.fuelTypes}
              onChange={(v) => setForm((f) => ({ ...f, fuelTypes: v }))}
            />
            <ChipGroup
              label="ناقل الحركة"
              options={TRANSMISSION_TYPES}
              labels={TRANSMISSION_LABELS}
              selected={form.transmissions}
              onChange={(v) => setForm((f) => ({ ...f, transmissions: v }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">إلغاء</button>
            <button onClick={() => void save()} disabled={saving} className="px-5 py-2 bg-[#0F3460] text-white rounded-[8px] text-sm font-medium disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">لا توجد فئات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr>
                <th className="text-right p-4 font-medium text-gray-500">الفئة</th>
                <th className="text-right p-4 font-medium text-gray-500">الماركة</th>
                <th className="text-right p-4 font-medium text-gray-500">الهيكل</th>
                <th className="text-right p-4 font-medium text-gray-500">الوقود</th>
                <th className="text-right p-4 font-medium text-gray-500">ناقل الحركة</th>
                <th className="text-right p-4 font-medium text-gray-500">موديلات</th>
                <th className="text-right p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-[#0F3460]">{c.nameAr}</div>
                    <div className="text-xs text-gray-400" dir="ltr">{c.nameEn}</div>
                  </td>
                  <td className="p-4 text-gray-600">{c.brand.nameAr}</td>
                  <td className="p-4">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {BODY_TYPE_LABELS[c.bodyType]}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {c.fuelTypes.length === 0 ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : c.fuelTypes.map((f) => (
                        <span key={f} className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">{FUEL_LABELS[f]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {c.transmissions.length === 0 ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : c.transmissions.map((tr) => (
                        <span key={tr} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">{TRANSMISSION_LABELS[tr]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{c._count.models}</td>
                  <td className="p-4">
                    <button onClick={() => void toggleActive(c)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${c.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {c.isActive ? 'نشط' : 'موقوف'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0F3460]"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الفئة"
        message={`هل أنت متأكد من حذف "${deleteTarget?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => { if (deleteTarget) void remove(deleteTarget); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Models Tab ────────────────────────────────────────────────────────────────

type ModelForm = { brandId: string; categoryId: string; name: string; yearStart: string; yearEnd: string }

function ModelsTab() {
  const [brands, setBrands]               = useState<Brand[]>([])
  const [categories, setCategories]       = useState<Category[]>([])
  const [models, setModels]               = useState<Model[]>([])
  const [filterBrandId, setFilterBrandId] = useState('')
  const [filterCatId, setFilterCatId]     = useState('')
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editItem, setEditItem]           = useState<Model | null>(null)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [form, setForm]                   = useState<ModelForm>({ brandId: '', categoryId: '', name: '', yearStart: '', yearEnd: '' })
  const [formCats, setFormCats]           = useState<Category[]>([])
  const [deleteTarget, setDeleteTarget]   = useState<Model | null>(null)

  const loadBrands = useCallback(async () => {
    const data = await apiFetch<Brand[]>('/api/v1/admin/catalog/brands')
    setBrands(data)
  }, [])

  const loadCategories = useCallback(async () => {
    const url = filterBrandId
      ? `/api/v1/admin/catalog/categories?brandId=${filterBrandId}`
      : '/api/v1/admin/catalog/categories'
    const data = await apiFetch<Category[]>(url)
    setCategories(data)
  }, [filterBrandId])

  const loadModels = useCallback(async () => {
    setLoading(true)
    try {
      const url = filterCatId
        ? `/api/v1/admin/catalog/models?categoryId=${filterCatId}`
        : '/api/v1/admin/catalog/models'
      const data = await apiFetch<Model[]>(url)
      setModels(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في التحميل')
    } finally { setLoading(false) }
  }, [filterCatId])

  useEffect(() => { void loadBrands() }, [loadBrands])
  useEffect(() => { void loadCategories() }, [loadCategories])
  useEffect(() => { void loadModels() }, [loadModels])

  useEffect(() => {
    if (!form.brandId) { setFormCats([]); return }
    void apiFetch<Category[]>(`/api/v1/admin/catalog/categories?brandId=${form.brandId}`)
      .then((data) => setFormCats(data))
      .catch(() => setFormCats([]))
  }, [form.brandId])

  function openCreate() {
    setForm({ brandId: filterBrandId || '', categoryId: filterCatId || '', name: '', yearStart: '', yearEnd: '' })
    setEditItem(null); setShowForm(true); setError('')
  }

  function openEdit(m: Model) {
    setForm({
      brandId: m.category.brand.id, categoryId: m.categoryId, name: m.name,
      yearStart: m.yearStart?.toString() ?? '', yearEnd: m.yearEnd?.toString() ?? '',
    })
    setEditItem(m); setShowForm(true); setError('')
  }

  async function save() {
    if (!form.categoryId || !form.name.trim()) { setError('الفئة والاسم مطلوبان'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        categoryId: form.categoryId, name: form.name.trim(),
        ...(form.yearStart ? { yearStart: Number(form.yearStart) } : {}),
        ...(form.yearEnd   ? { yearEnd:   Number(form.yearEnd)   } : {}),
        ...(editItem ? { id: editItem.id } : {}),
      }
      await apiFetch('/api/v1/admin/catalog/models', { method: editItem ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setShowForm(false); void loadModels()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ')
    } finally { setSaving(false) }
  }

  async function toggleActive(m: Model) {
    try {
      await apiFetch('/api/v1/admin/catalog/models', { method: 'PATCH', body: JSON.stringify({ id: m.id, isActive: !m.isActive }) })
      void loadModels()
    } catch { /* silent */ }
  }

  async function remove(m: Model) {
    try {
      await apiFetch('/api/v1/admin/catalog/models', { method: 'DELETE', body: JSON.stringify({ id: m.id }) })
      toast.success('تم حذف الموديل بنجاح')
      void loadModels()
    } catch { /* silent */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <select value={filterBrandId} onChange={(e) => { setFilterBrandId(e.target.value); setFilterCatId('') }}
            className="border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460] bg-white">
            <option value="">كل الماركات</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
          </select>
          <select value={filterCatId} onChange={(e) => setFilterCatId(e.target.value)}
            className="border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460] bg-white">
            <option value="">كل الفئات</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadModels()} className="p-2 hover:bg-gray-100 rounded-[8px] text-gray-400"><RefreshCw size={14} /></button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#C9A84C] text-white px-4 py-2 rounded-[8px] text-sm font-medium">
            <Plus size={14} /> موديل جديد
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-[12px] p-4 space-y-3">
          <h3 className="font-semibold text-[#0F3460] text-sm">{editItem ? 'تعديل الموديل' : 'موديل جديد'}</h3>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">الماركة <span className="text-red-400">*</span></label>
              <select value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value, categoryId: '' }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]">
                <option value="">اختر الماركة</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الفئة <span className="text-red-400">*</span></label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" disabled={!form.brandId}>
                <option value="">اختر الفئة</option>
                {formCats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">اسم الموديل <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="Camry 2024" dir="ltr" />
            </div>
          </div>
          {/* Year range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">سنة البداية (اختياري)</label>
              <input type="number" value={form.yearStart} onChange={(e) => setForm((f) => ({ ...f, yearStart: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="2020" dir="ltr" min="1900" max="2100" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">سنة النهاية (اختياري)</label>
              <input type="number" value={form.yearEnd} onChange={(e) => setForm((f) => ({ ...f, yearEnd: e.target.value }))}
                className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F3460]" placeholder="2025" dir="ltr" min="1900" max="2100" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">إلغاء</button>
            <button onClick={() => void save()} disabled={saving} className="px-5 py-2 bg-[#0F3460] text-white rounded-[8px] text-sm font-medium disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[12px] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
        ) : models.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">لا توجد موديلات</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr>
                <th className="text-right p-4 font-medium text-gray-500">الموديل</th>
                <th className="text-right p-4 font-medium text-gray-500">الفئة</th>
                <th className="text-right p-4 font-medium text-gray-500">الماركة</th>
                <th className="text-right p-4 font-medium text-gray-500">السنوات</th>
                <th className="text-right p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-[#0F3460]" dir="ltr">{m.name}</td>
                  <td className="p-4 text-gray-600">{m.category.nameAr}</td>
                  <td className="p-4 text-gray-600">{m.category.brand.nameAr}</td>
                  <td className="p-4 text-gray-500 text-xs" dir="ltr">
                    {m.yearStart || m.yearEnd ? `${m.yearStart ?? '?'} – ${m.yearEnd ?? '?'}` : '—'}
                  </td>
                  <td className="p-4">
                    <button onClick={() => void toggleActive(m)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${m.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {m.isActive ? 'نشط' : 'موقوف'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[#0F3460]"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(m)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الموديل"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => { if (deleteTarget) void remove(deleteTarget); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
