# Session State — Design, i18n & UX Improvements

**Date:** 2026-06-13  
**Branch:** `main`  
**Status:** ✅ كل التغييرات مرفوعة على GitHub `main`

---

## ما تم إنجازه

### 1. i18n — استبدال النصوص العربية الثابتة

**ملفات الترجمة:**
- `apps/web/messages/en.json` — namespaces: `salesPage`, `customersPage`, `reportsPage`, `auctionsPage`, `printSlip`, `adminShowrooms`, `adminPlans`, `adminKyc`, `adminPayments`, `inventoryPage`, `settingsPage`, `adminShell`
- `apps/web/messages/ar.json` — نفس البنية بالعربية

**صفحات الداشبورد (server components):**
- `(dashboard)/sales/page.tsx`
- `(dashboard)/customers/page.tsx`
- `(dashboard)/reports/page.tsx`
- `(dashboard)/auctions/page.tsx`
- `(dashboard)/inventory/page.tsx`

**مكونات الداشبورد (client components):**
- `(dashboard)/billing/BillingClient.tsx`
- `(dashboard)/settings/SettingsClient.tsx`
- `(dashboard)/inventory/[id]/print/PrintSlipClient.tsx`

**مكونات الأدمن:**
- `(admin)/admin/showrooms/AdminShowroomsClient.tsx`
- `(admin)/admin/plans/AdminPlansClient.tsx`
- `(admin)/admin/kyc/AdminKycClient.tsx`
- `(admin)/admin/payments/page.tsx`
- `components/admin/AdminShell.tsx` — قائمة جانبية بالكامل + `dir` ديناميكي

---

### 2. إصلاحات UX

| المشكلة | الملف | الإصلاح |
|---------|-------|---------|
| تسجيل الخروج يوجّه لـ `app.carsell.one` | `Topbar.tsx`, `AdminShell.tsx` | `signOut({ callbackUrl: 'https://carsell.one/...' })` |
| القائمة تمتد مع المحتوى | `DashboardShell.tsx`, `AdminShell.tsx` | `h-screen` + `min-h-0` + `overflow-y-auto` على `<main>` |
| ماركت يظهر فارغاً عند بحث بدون نتائج | `MarketClient.tsx` | EmptyState يعرض نص البحث وزر "تصفّح جميع السيارات" |
| `.claude` مجلد في GitHub | `.gitignore` | حُذف وأضيف للـ gitignore |

---

### 3. تصميم — shadcn/ui + Tailwind

**مكونات جديدة:**
- `components/ui/button.tsx` — Button مع variants (default, accent, outline, ghost, destructive)
- `components/ui/badge.tsx` — Badge مع variants
- `components/ui/card.tsx` — Card, CardHeader, CardContent, CardFooter
- `components/ui/ToastProvider.tsx` — مضاف على root layout
- `components/ui/ConfirmDialog.tsx` — popup تأكيد الحذف
- `lib/utils.ts` — دالة `cn()`

**حزم مثبّتة:**
```
@radix-ui/react-slot
@radix-ui/react-dropdown-menu
@radix-ui/react-dialog
@radix-ui/react-avatar
@radix-ui/react-separator
class-variance-authority
react-hot-toast
```

**مكونات معاد تصميمها:**
- `Sidebar.tsx` — gradient navy، أيقونة CarSell ذهبية، نقطة نشطة، `h-screen sticky`
- `Topbar.tsx` — initials المعرض، جرس إشعارات، رابط Market بإطار ذهبي
- `KpiCard.tsx` — أيقونات ملونة، trend indicators، hover gradient
- `ShowroomHeader.tsx` — hero كامل العرض، gradient overlay، شارة موثّق، WhatsApp أخضر
- `PublicCarCard.tsx` — zoom عند hover، quick view arrow، تصميم أنظف
- `MarketClient.tsx` — MarketCarCard بـ rounded-2xl وhover أقوى

---

### 4. استخدام Toast و ConfirmDialog

**Toast:**
```tsx
import toast from 'react-hot-toast'

toast.success('تم الحفظ بنجاح')
toast.error('حدث خطأ، يرجى المحاولة مجدداً')
```

**ConfirmDialog:**
```tsx
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

<ConfirmDialog
  open={showConfirm}
  title="حذف السيارة"
  message="هل أنت متأكد؟ لا يمكن التراجع."
  confirmLabel="حذف"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

---

## المتبقي من المشروع

### أولوية عالية ❗

- [ ] **ربط toast بعمليات CRUD** في:
  - `AdminShowroomsClient.tsx`
  - `AdminPlansClient.tsx`
  - `AdminKycClient.tsx`
  - `inventory/` صفحات إضافة وتعديل السيارة
  - `settings/SettingsClient.tsx`
  - `billing/BillingClient.tsx`

- [ ] **ConfirmDialog قبل كل حذف** في الصفحات أعلاه

- [ ] **Pagination للأدمن:**
  - `(admin)/admin/kyc/`
  - `(admin)/admin/payments/`

### أولوية متوسطة ⚡

- [ ] اختبار RTL كامل للأدمن بالعربية
- [ ] تحسين صفحة تفاصيل السيارة (market + showroom)
- [ ] تحسين صفحة Pricing
- [ ] صفحة 404 مخصصة

### أولوية منخفضة 📌

- [ ] Dark mode
- [ ] Search في الداشبورد
- [ ] Notifications system
- [ ] Skeleton loading screens محسّنة

---

## معلومات تقنية مهمة

- **GitHub token** — لتفعيله في كل جلسة: `git remote set-url origin https://<TOKEN>@github.com/wa1eeed/carsell.git`
- **NEXTAUTH_URL** — يجب أن يكون `https://carsell.one` وليس `app.carsell.one`
- **NODE_OPTIONS** في Dockerfile — `--max-old-space-size=2048`
- **Deploy** — Coolify يسحب من branch `main`

## آخر Commits

```
bd4a463 fix: sidebar stays fixed height, main content scrolls correctly
57d0f4d feat: ToastProvider + ConfirmDialog + sidebar h-screen fix
ecc8bba fix: improve market empty state
677011e revert: restore callbackUrl for sign-out
5e61704 fix: sign-out redirects to carsell.one
8de3648 feat: redesign showroom landing, market cards, public car cards
5a99b14 feat: redesign dashboard UI — shadcn/ui base components
2fada5b feat: i18n across dashboard and admin
```
