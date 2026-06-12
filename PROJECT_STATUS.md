# CarSell — حالة المشروع
> آخر تحديث: 2026-06-11 · الإصدار: v0.7.0 (deployment in progress)

> **اقرأ هذا الملف في بداية كل جلسة** للوقوف على وضع المشروع، ما تم، الباقي، والمشاكل المفتوحة.

---

## 🧭 المشروع باختصار

- **CarSell** — منصة SaaS لمعارض السيارات في السعودية والخليج
- **الدومين**: `carsell.one` · `app.carsell.one` · `admin.carsell.one` · `{slug}.carsell.one`
- **Repo**: `github.com/wa1eeed/carsell` (branch `main`)
- **Stack**: Next.js 14 · PostgreSQL 16 + Prisma · NextAuth · Tap.company · R2 · next-intl
- **اللغات**: العربية (افتراضي RTL) + الإنجليزية (LTR)

---

## ✅ ما تم إنجازه

### الأساس (v0.1 → v0.3)
- Auth (email/password + Nafath OIDC) + onboarding 4 خطوات
- Dashboard + Inventory (CRUD + VDM/Absher + Mojaz + accidents)
- Publish flow (Fixed/SOUM/Auction) + Sales + VAT (server-side)
- Showroom landing pages
- **Subscriptions + Tap.company billing** + feature gating
- **Super Admin** منفصل (`admin.carsell.one`): plans, showrooms, KYC, payments, settings

### الماركت بليس والمشاركة (v0.4)
- CarSell Live (`/market`) — السوق العام
- مشاركة + Print slip + QR code (A4 + بطاقة)
- **عزل المستأجرين** مُحكَم (`showroomId` في كل query)
- **أمان**: CSP/HSTS, rate limiting, JWT re-validation كل 5 دقائق
- **R2 media auto-cleanup**: media/ تُحذف بعد البيع، docs/ تبقى دائماً

### الروابط والدومين (v0.5)
- **Pretty URLs**: `carsell.one/{slug}` (بدل `/showrooms/{slug}`)
- **Custom domains**: المعرض يربط دومينه عبر DNS verification (TXT + A/CNAME)
- **`useOrigin()` hook** لمنع hydration mismatches

### اكتمال الصفحات (v0.6)
- ✅ Sales · Customers · Reports (كلها مكتملة بإحصائيات)
- ✅ Admin KYC queue · Admin Payments
- إصلاح status codes (400/409 بدل 500)

### إعادة التسمية ومتانة الأساسات (v0.6+)
- **CarLink → CarSell**, الدومين `carlink.sa → carsell.one` (68 ملف)
- **مبدأ المتانة أولاً** سُجّل في `CLAUDE.md` (تطبيقه إلزامي في كل تطوير)
- **فهارس DB** على المسارات الساخنة (cars, sales, customers, ...) — 11 فهرس

### الإصلاحات الأخيرة (v0.7 — قيد النشر)
- **حقل جوال دولي**: دروب داون لكل الدول + رقم بدون صفر → E.164
- **صفحة الطلبات الجديدة** (`/requests`): حجز/سوم/شراء — ✅ ثنائي اللغة كامل
  - مشتري يقدّم طلب من صفحة الماركت ← معرض يقبل/يرفض/يكمل
- **الماركت في الهيدر** (تاب جديد) بدل sidebar
- **شيلت النطاق الفرعي** من اللوحة (نبقي `/slug` فقط)
- **i18n للـ feature components**: SubscriptionBanner + PlanGate (✅)

---

## ⏳ الباقي (حسب الأولوية)

### 🔴 الأولوية الفورية
1. **إنهاء النشر على Coolify** (راجع المشكلة الحالية أدناه)
2. **رابط دخول الأدمن** + بقية ملاحظاتك (التالي)

### 🟡 i18n للصفحات القديمة (Hardcoded Arabic)
**12 ملف باقي** فيها نصوص عربية ثابتة → في الإنجليزية لا تزال تظهر عربي:
- `(dashboard)/customers/page.tsx` (~5)
- `(dashboard)/sales/page.tsx` (~13)
- `(dashboard)/billing/BillingClient.tsx` (~15)
- `(dashboard)/reports/page.tsx` (~16)
- `(dashboard)/settings/SettingsClient.tsx` (~25)
- `(admin)/admin/page.tsx` (~18)
- `(admin)/admin/plans/AdminPlansClient.tsx` (~23)
- `(admin)/admin/showrooms/AdminShowroomsClient.tsx` (~9)
- `(admin)/admin/kyc/AdminKycClient.tsx` (~13)
- `(admin)/admin/payments/page.tsx` (~10)
- `(admin)/admin/settings/AdminSettingsClient.tsx` (~28)
- `features/dashboard/PublicLinksPanel.tsx` (~12)

### 🟢 الجزء الكبير: اللاندينق + الماركت بليس
**اللاندينق بيج التسويقي** للدومين الرئيسي (يستهدف المعارض):
- صفحة hero تسويقية للمعارض
- مزايا المنصة، أرقام، شهادات
- CTA للتسجيل

**إعادة تصميم الماركت بليس** (carsell.one/market):
- كاروسيل: سيارات جديدة حديثة الإضافة
- كاروسيل: سيارات مستعملة حديثة الإضافة
- كاروسيل: مزادات نشطة الآن
- بحث رئيسي حسب البراند / شكل المركبة (سيدان، SUV...)
- فلاتر كاملة (سعر، سنة، كيلومتر، وقود، ناقل، لون، مدينة، حالة)
- **تاق "متاح بالتمويل"** على بطاقة السيارة (لو المعرض فعّل خيار البيع بالتمويل)
- صفحة تفاصيل السيارة مع نفس التصميم

### 🔵 المزاد (مؤجّل كما طلبت — مسجّل)
- تطوير صفحة المزاد (الصورة ضبابية)
- إعدادات المزاد (الحد الأدنى، العربون)
- محفظة العميل (يدفع عربون → يفعّل المزايدة)
- ربط الباقات بإمكانية المزايدة

### 🟣 أمور تشغيلية لاحقاً
- Connection pooling (PgBouncer) لما يكبر الحمل
- Sentry للأخطاء
- E2E tests (Playwright)
- Backups يومية تلقائية (Coolify Scheduled Backups أو pg_dump → R2)
- Developer Portal (`developers.carsell.one`)
- Notifications (SMS/WhatsApp)

---

## 🐛 المشكلة الحالية المفتوحة

### `node prisma/seed.cjs` → `Cannot find module`

**السياق**: المستخدم يحاول إنشاء السوبر أدمن في الإنتاج. الكونتينر الحالي مبني من Dockerfile **قديم** (قبل ما نضيف `seed.cjs`).

**الإصلاح الذي تم دفعه** (commit `0b034fb`):
- حوّلنا الـ seed لـ **JavaScript خالص** (`prisma/seed.mjs`)
- يشتغل بـ `node prisma/seed.mjs` مباشرة — بدون tsx ولا compile
- اختُبر محلياً ✅ (يزرع الباقات + ينشئ السوبر أدمن من env vars)

**الخطوات المتبقية على المستخدم**:
1. **Redeploy** في Coolify (يأخذ آخر commit من main)
2. تأكد إن الـ deploy نجح (مش rollback) — راقب الـ logs لين تشوف `healthy`
3. في تيرمينال تطبيق `carsell` (مش قاعدة البيانات):
   ```bash
   ls prisma/                 # لازم يظهر seed.mjs
   node prisma/seed.mjs       # ينشئ السوبر أدمن
   ```

**بديل تلقائي** (لتجنب الأمر اليدوي):
- في Coolify Environment Variables أضف: `SEED_ON_START=true`
- أي redeploy يزرع تلقائياً (idempotent)
- بعد أول مرة، شيله

---

## 🔐 بيانات السوبر أدمن

**لا توجد بيانات افتراضية في الكود** (أمان).

**تُنشأ من env vars** عند تشغيل الـ seed:
```
SUPER_ADMIN_EMAIL=admin@carsell.one
SUPER_ADMIN_PASSWORD=<باسوورد_قوي>
```

**محلياً** (للتجربة) — تم إنشاؤه:
```
admin@carsell.one / JsJntc7qKZxu9O4E
```

**رابط الدخول**: `admin.carsell.one`

---

## 📦 إعدادات Coolify المطلوبة

### Environment Variables
```bash
DATABASE_URL=postgresql://carsell_db:...@o10eg25xmh0u9t7eiv0n7tzq:5432/postgres
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://app.carsell.one
ROOT_DOMAIN=carsell.one
NODE_ENV=production

# Storage (تُضاف بعد إنشاء R2 bucket)
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=carsell-prod
R2_PUBLIC_URL=

# Tap.company (test أول، live لاحقاً من Super Admin Settings)
TAP_SECRET_KEY=
TAP_PUBLIC_KEY=
TAP_ENV=test

# Super Admin (للـ seed)
SUPER_ADMIN_EMAIL=admin@carsell.one
SUPER_ADMIN_PASSWORD=<strong>

# Cron + Custom domains
CRON_SECRET=<openssl rand -hex 32>
PLATFORM_IP=<VPS_IP>
PLATFORM_CNAME=cname.carsell.one
MEDIA_DELETE_AFTER_DAYS=30

# (اختياري) لو تبي seed يشتغل تلقائياً عند الإقلاع
SEED_ON_START=true
```

### General Settings
- **Build Pack**: Dockerfile
- **Base Directory**: `/` (الجذر — `Dockerfile` في الجذر)
- **NODE_ENV**: شيل "Available at Buildtime" (خلّه Runtime only)

### Domains (تبويب منفصل عن env vars)
```
carsell.one
www.carsell.one
app.carsell.one
admin.carsell.one
*.carsell.one    ← wildcard مهم
```

### DNS
كل النطاقات → IP الـ VPS، أهمها wildcard `*.carsell.one`

---

## 🎯 الترتيب القادم (متفق عليه)

1. **i18n للصفحات القديمة** (12 ملف) — كل واجهة بلغتها
2. **اللاندينق بيج + الماركت بليس** (تصميم كبير) — مع تاق التمويل والفلاتر الكاملة
3. **رابط دخول الأدمن** + بقية الملاحظات (سيُذكر تفصيلاً في الجلسة القادمة)

---

## 🗺️ خريطة الروابط

| الرابط | الوصف |
|---|---|
| `carsell.one` | الواجهة الرئيسية (مستقبلاً: لاندينق تسويقي) |
| `carsell.one/market` | CarSell Live — السوق العام |
| `carsell.one/{slug}` | صفحة معرض محدد |
| `carsell.one/{slug}/cars/{id}` | تفاصيل سيارة |
| `app.carsell.one` | لوحة تحكم المعرض (محمية) |
| `admin.carsell.one` | لوحة السوبر أدمن (محمية، PLATFORM_ADMIN فقط) |
| `{custom-domain.com}` | دومين مخصص للمعرض (بعد DNS verification) |

---

## 📚 ملفات مرجعية مهمة

| الملف | المحتوى |
|---|---|
| `CLAUDE.md` | تعليمات المشروع لـ Claude — مبدأ المتانة أولاً |
| `CHANGELOG.md` | سجل كل التغييرات بالإصدارات |
| `docs/engineering/scalability.md` | أنماط القابلية للتوسع + جدول الفهارس |
| `docs/infrastructure/deployment.md` | دليل النشر الكامل |
| `docs/infrastructure/r2-cors.json` | إعداد CORS لـ R2 |
| `prisma/schema.prisma` | هيكل قاعدة البيانات (مع كل الفهارس) |

---

## 💾 الـ commits الأخيرة (للسياق)

```
0b034fb fix: plain-JS seed (seed.mjs) — runs with node, no tsx/compile  ⬅ آخر إصلاح
19a79b6 fix: precompile seed to seed.cjs in build  (بديل، استُبدل)
de8e4ba i18n: SubscriptionBanner + PlanGate use translation keys
a05d1de docs: document SUPER_ADMIN_EMAIL/PASSWORD env vars
2a0b8dd feat: car requests (reservation/soum/purchase) + market in header
8f5ac8c feat: international phone input
e53208c fix: healthcheck uses IPv4 (127.0.0.1) + longer start period
efd8350 fix: move Dockerfile to repo root for Coolify
345c7d4 docs: enshrine 'Robustness First' as the governing project principle
842eecf perf: add database indexes on hot query paths
4a4aac0 rebrand: CarLink → CarSell
a319066 CarLink v0.6.0 — initial commit
```
