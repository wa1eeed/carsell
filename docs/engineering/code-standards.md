# معايير الهندسة — Engineering Standards

> هذا الملف إلزامي. يُقرأ قبل كتابة أي سطر كود.
> الهدف: كود يُبنى مرة واحدة بشكل صحيح، لا يُعاد كتابته كل توسّع.

---

## المبادئ الأساسية

### ١. الفصل الواضح بين الطبقات (Separation of Concerns)

```
UI Components     → يعرض فقط، لا منطق عمل
Hooks / Services  → منطق الواجهة، لا DB مباشرة
API Routes        → validation + auth + استدعاء الـ service
Services          → منطق العمل الكامل
Repositories      → كل DB queries هنا فقط، لا Prisma في غيره
```

لا `prisma.car.findMany()` في API Route مباشرة. كل شيء عبر Repository.

```typescript
// ✓ صح
// api/cars/route.ts
const cars = await carRepository.findByShowroom(showroomId, filters)

// ✗ خطأ
// api/cars/route.ts
const cars = await prisma.car.findMany({ where: { showroomId } })
```

---

### ٢. قاعدة الملف الواحد لكل مسؤولية (Single Responsibility)

كل ملف له غرض واحد واضح. إذا احتجت تصف ملفاً بـ "يعمل X وY وZ" — قسّمه.

```
carRepository.ts     → queries السيارات فقط
carService.ts        → منطق العمل (حساب الربح، تغيير الحالة)
carValidator.ts      → validation schemas (Zod)
carTypes.ts          → TypeScript types/interfaces
```

---

### ٣. لا Magic Numbers — كل ثابت له اسم

```typescript
// ✗ خطأ
if (images.length >= 20) throw new Error('...')
await getSignedUrl(r2, command, { expiresIn: 3600 })

// ✓ صح
import { CAR_LIMITS, STORAGE_EXPIRY } from '@/lib/constants'
if (images.length >= CAR_LIMITS.MAX_IMAGES) throw new Error('...')
await getSignedUrl(r2, command, { expiresIn: STORAGE_EXPIRY.IMAGE_PREVIEW })
```

---

### ٤. Typed Everything — لا `any`

```typescript
// ✗ ممنوع
function calcProfit(car: any): any { ... }

// ✓ مطلوب
function calcProfit(car: CarWithExpenses): ProfitCalculation { ... }
```

نفّعّل `strict: true` في `tsconfig.json`. لا استثناء.

---

### ٥. Errors تُعالَج صراحةً

```typescript
// ✗ خطأ — يخفي المشكلة
try { ... } catch (e) { console.log(e) }

// ✓ صح — خطأ منظّم يصل للـ client
try {
  ...
} catch (error) {
  logger.error('car.create.failed', { error, carId, showroomId })
  throw new AppError('CAR_CREATE_FAILED', 'فشل إنشاء السيارة', 500)
}
```

---

## بنية الكود — Folder Structure الكاملة

```
apps/web/
├── app/                          ← Next.js routes
│   ├── (marketing)/
│   ├── (dashboard)/
│   ├── (showroom)/
│   ├── (market)/
│   └── api/
│       └── v1/                   ← إصدار الـ API صريح دائماً
│           ├── cars/
│           ├── sales/
│           └── ...
│
├── components/
│   ├── ui/                       ← مكوّنات عامة (Button, Input, Card)
│   ├── features/                 ← مكوّنات خاصة بميزة
│   │   ├── cars/
│   │   │   ├── CarCard.tsx
│   │   │   ├── CarForm.tsx
│   │   │   └── CarTimeline.tsx
│   │   └── sales/
│   └── layouts/
│
├── lib/
│   ├── constants.ts              ← كل الثوابت مركّزة هنا
│   ├── errors.ts                 ← AppError class
│   ├── logger.ts                 ← Structured logging
│   ├── prisma.ts                 ← Prisma client singleton
│   └── validations/              ← Zod schemas
│       ├── car.schema.ts
│       └── sale.schema.ts
│
├── repositories/                 ← كل DB queries هنا فقط
│   ├── car.repository.ts
│   ├── sale.repository.ts
│   └── showroom.repository.ts
│
├── services/                     ← Business logic
│   ├── car.service.ts
│   ├── sale.service.ts
│   ├── tax.service.ts            ← حساب VAT
│   └── profit.service.ts
│
└── hooks/                        ← React hooks
    ├── useCars.ts
    └── useSale.ts
```

---

## API Design

### نمط موحّد للـ Responses

```typescript
// lib/api-response.ts
export const ok = <T>(data: T, meta?: object) =>
  NextResponse.json({ success: true, data, meta })

export const fail = (code: string, message: string, status = 400) =>
  NextResponse.json({ success: false, error: { code, message } }, { status })

// الاستخدام
return ok({ cars, total })
return fail('CAR_NOT_FOUND', 'السيارة غير موجودة', 404)
```

### Versioning صريح

كل API تحت `/api/v1/`. عند تغيير breaking → `/api/v2/` بدون حذف v1 فوراً.

### Rate Limiting

```typescript
// كل route تحدد حدودها
export const config = {
  rateLimit: { window: '1m', max: 60 }   // 60 req/min عادي
}
// Upload endpoints أكثر تقييداً
export const config = {
  rateLimit: { window: '1m', max: 10 }
}
```

---

## Constants المركزية

```typescript
// lib/constants.ts

export const CAR_LIMITS = {
  MAX_IMAGES: 20,
  MAX_DOCUMENTS: 10,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DOC_SIZE_MB: 20,
} as const

export const STORAGE_EXPIRY = {
  IMAGE_PREVIEW: 60 * 60,        // 1h
  DOCUMENT_VIEW: 60 * 15,        // 15m
  DOCUMENT_DOWNLOAD: 60 * 5,     // 5m
  UPLOAD_URL: 60 * 10,           // 10m
} as const

export const VAT = {
  RATE: 0.15,                    // 15% — يُحدَّث من PlatformConfig
  METHODS: {
    FULL_PRICE: 'FULL_PRICE',
    PROFIT_MARGIN: 'PROFIT_MARGIN',
  },
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

export const PLATE_LIMITS = {
  MIN_LETTERS: 1,
  MAX_LETTERS: 3,
  MIN_DIGITS: 1,
  MAX_DIGITS: 4,
} as const
```

---

## اللغة وتعدد اللغات — i18n

### اللغتان الرسميتان
```
الأساس:    English (en)   ← اللغة الأصلية للكود
الثانية:   Arabic  (ar)   ← نسخة كاملة مع RTL
```

### الاتجاه حسب اللغة
```
ar → direction: rtl   html[lang="ar"]
en → direction: ltr   html[lang="en"]
```

### المكتبة المختارة: next-intl
```bash
npm install next-intl
```

### هيكل ملفات الترجمة
```
messages/
├── en.json    ← النصوص الإنجليزية (المصدر)
└── ar.json    ← النصوص العربية
```

### بنية ملفات الترجمة
```json
// en.json
{
  "nav": {
    "dashboard": "Dashboard",
    "inventory": "Inventory",
    "sales": "Sales"
  },
  "car": {
    "status": {
      "available": "Available",
      "reserved": "Reserved",
      "sold": "Sold"
    },
    "fields": {
      "price": "Price",
      "year": "Year",
      "odometer": "Odometer"
    }
  }
}

// ar.json
{
  "nav": {
    "dashboard": "لوحة التحكم",
    "inventory": "المخزون",
    "sales": "المبيعات"
  },
  "car": {
    "status": {
      "available": "متاحة",
      "reserved": "محجوزة",
      "sold": "مباعة"
    },
    "fields": {
      "price": "السعر",
      "year": "السنة",
      "odometer": "الكيلومتراج"
    }
  }
}
```

### Middleware — كشف اللغة
```typescript
// middleware.ts — يُضاف للمنطق الموجود
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware({
  locales:       ['en', 'ar'],
  defaultLocale: 'ar',          // الافتراضي: عربي
  localePrefix:  'as-needed',   // /ar/ فقط للإنجليزي: /en/dashboard
})
```

### تطبيق RTL/LTR في الـ Layout
```tsx
// app/[locale]/layout.tsx
export default function RootLayout({ children, params: { locale } }) {
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={locale === 'ar' ? 'font-arabic' : 'font-sans'}>
        {children}
      </body>
    </html>
  )
}
```

### الخطوط حسب اللغة
```css
/* عربي */
html[lang="ar"] { font-family: 'IBM Plex Sans Arabic', sans-serif; }

/* إنجليزي */
html[lang="en"] { font-family: 'IBM Plex Sans', 'Inter', sans-serif; }

/* مشترك — الأرقام والكود */
.font-mono { font-family: 'IBM Plex Mono', monospace; }
```

### الاستثناءات — دائماً LTR بغض النظر عن اللغة
```css
/* هذه العناصر LTR دائماً */
.vin,
.plate-number,
.price-number,
.phone-number,
.id-number,
.font-mono {
  direction: ltr !important;
  text-align: left;
}
```

### الاستخدام في المكوّنات
```tsx
import { useTranslations } from 'next-intl'

export function CarCard({ car }) {
  const t = useTranslations('car')

  return (
    <div>
      <span>{t('fields.price')}</span>
      <span className="font-mono ltr">{car.price.toLocaleString()}</span>
      <span className={`badge badge-${car.status}`}>
        {t(`status.${car.status}`)}
      </span>
    </div>
  )
}
```

### قاعدة مهمة — لا نصوص مباشرة في الكود
```tsx
// ✗ خطأ
<button>إضافة سيارة</button>
<button>Add Car</button>

// ✓ صح
<button>{t('actions.addCar')}</button>
```

### مُبدّل اللغة
```tsx
// مكوّن ثابت في الـ Topbar
<LocaleSwitcher />
// يبدّل بين /ar/ و /en/ مع الحفاظ على نفس المسار
```

### الأرقام والتواريخ
```typescript
// الأرقام
const price = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'SAR',
}).format(345000)
// ar: ٣٤٥,٠٠٠ ر.س
// en: SAR 345,000

// التواريخ
const date = new Intl.DateTimeFormat(locale, {
  dateStyle: 'medium',
}).format(new Date())
// ar: ٧ يونيو ٢٠٢٦
// en: Jun 7, 2026
```
