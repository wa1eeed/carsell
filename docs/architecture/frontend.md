# بنية الفرونت إند — Frontend Architecture

> ٤ طبقات على ٣+ دومينات، كلها في Next.js monorepo واحد

---

## الطبقات الأربع

```
الطبقة ١  carlink.sa                  ← تسويقية — Landing Page
الطبقة ٢  app.carlink.sa              ← لوحة البائع — SaaS Dashboard
الطبقة ٣  {slug}.carlink.sa           ← معرض البائع الإلكتروني (subdomain)
           أو custom domain            ← مثل fahadcars.com (للباقات المدفوعة)
الطبقة ٤  carlink.sa/market           ← CarLink Market (اختياري)
```

---

## هيكل المجلدات — Next.js Monorepo

```
apps/
├── web/                          ← Next.js app — يخدم الطبقات الأربعة
│   ├── app/
│   │   ├── (marketing)/          ← طبقة ١: carlink.sa
│   │   │   ├── page.tsx          ← الصفحة الرئيسية
│   │   │   ├── pricing/          ← صفحة الباقات
│   │   │   └── features/
│   │   │
│   │   ├── (dashboard)/          ← طبقة ٢: app.carlink.sa
│   │   │   ├── layout.tsx        ← sidebar + auth guard
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx      ← قائمة السيارات
│   │   │   │   ├── new/          ← إضافة سيارة
│   │   │   │   └── [id]/         ← تفاصيل سيارة
│   │   │   ├── sales/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   │       └── showroom/     ← إعدادات الواجهة العامة
│   │   │
│   │   ├── (showroom)/           ← طبقة ٣: {slug}.carlink.sa
│   │   │   ├── layout.tsx        ← header المعرض + theme البائع
│   │   │   ├── page.tsx          ← كل السيارات + فلاتر
│   │   │   └── cars/
│   │   │       └── [carId]/      ← صفحة سيارة واحدة
│   │   │
│   │   ├── (market)/             ← طبقة ٤: carlink.sa/market
│   │   │   ├── page.tsx          ← سوق عام
│   │   │   └── cars/[id]/
│   │   │
│   │   └── api/                  ← API Routes
│   │       ├── auth/
│   │       ├── cars/
│   │       ├── sales/
│   │       └── showroom/
│   │
│   └── middleware.ts             ← Domain routing ← المهم
```

---

## middleware.ts — قلب توجيه الدومينات

هذا الملف يقرأ الدومين ويوجّه للـ route group الصحيح:

```typescript
// apps/web/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // ── app.carlink.sa → لوحة التحكم ────────────
  if (hostname.startsWith('app.')) {
    // rewrite لـ route group (dashboard)
    return NextResponse.rewrite(
      new URL(`/dashboard${pathname}`, req.url)
    )
  }

  // ── {slug}.carlink.sa → واجهة المعرض ─────────
  const rootDomain = process.env.ROOT_DOMAIN ?? 'carlink.sa'
  const isSubdomain =
    hostname !== rootDomain &&
    hostname !== `www.${rootDomain}` &&
    hostname.endsWith(`.${rootDomain}`)

  if (isSubdomain) {
    const slug = hostname.replace(`.${rootDomain}`, '')
    // أضف الـ slug كـ header ليقرأه الـ layout
    const res = NextResponse.rewrite(
      new URL(`/showroom${pathname}`, req.url)
    )
    res.headers.set('x-showroom-slug', slug)
    return res
  }

  // ── Custom domain → واجهة المعرض ─────────────
  // (fahadcars.com مثلاً)
  // نبحث في DB هل هذا الدومين مسجّل لمعرض
  // يتم عبر Edge middleware + KV cache لتجنب DB call في كل request
  // (يُطبَّق لاحقاً — Pro+ فقط)

  // ── carlink.sa العادي ← تسويقي أو /market ────
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon|api/auth).*)'],
}
```

---

## صفحة المعرض الإلكتروني — طبقة ٣

### ما تتضمنه

| القسم | الوصف |
|---|---|
| Header | شعار المعرض + اسمه + تواصل |
| فلاتر | براند، فئة، موديل، سنة، سعر (من/إلى)، الحالة |
| كروت السيارات | صورة رئيسية، الاسم، المواصفات، السعر، badge الحالة |
| تفاصيل سيارة | معرض صور، مواصفات كاملة، لوحة، زر واتساب/اتصال |
| Footer | بيانات المعرض + "مدعوم بـ CarLink" |

### الفلاتر

تعمل كـ URL params: `?brand=toyota&model=land-cruiser&min=200000`
- قابلة للمشاركة كرابط محدد
- تُحمَّل server-side (SSR) لأفضل SEO

### URL Structure

```
fahad-cars.carlink.sa/                     ← كل السيارات
fahad-cars.carlink.sa/?brand=toyota        ← فلتر براند
fahad-cars.carlink.sa/cars/abc123          ← سيارة محددة
```

---

## Subdomain vs Custom Domain

| الميزة | Subdomain | Custom Domain |
|---|---|---|
| المثال | fahad.carlink.sa | fahadcars.com |
| الباقة | Basic فأعلى | Pro+ |
| الإعداد | تلقائي عند إنشاء الحساب | البائع يضيف CNAME يدوياً |
| SSL | تلقائي (Wildcard) | عبر Cloudflare Proxy |
| التنفيذ | Wildcard DNS + middleware | Custom domain table في DB + middleware |

### إعداد Wildcard DNS (Coolify / VPS)

```
# DNS Records
*.carlink.sa    A    → IP_VPS
carlink.sa      A    → IP_VPS
app.carlink.sa  A    → IP_VPS
```

### Custom Domain في DB

```prisma
// إضافة على Showroom
model Showroom {
  customDomain   String?  @unique  // fahadcars.com
  customDomainVerified Boolean @default(false)
}
```

---

## إعدادات المعرض الإلكتروني (من لوحة التحكم)

البائع يتحكم في واجهته من `app.carlink.sa/settings/showroom`:

```typescript
interface ShowroomPageSettings {
  // الهوية
  displayName: string      // "معرض الفهد للسيارات"
  logoUrl: string
  coverImageUrl?: string
  tagline?: string         // "أفضل السيارات بأفضل الأسعار"
  city: string

  // التواصل
  whatsappNumber: string   // يظهر على زر واتساب
  phone?: string
  instagramUrl?: string

  // الواجهة
  accentColor?: string     // لون رئيسي للمعرض (اختياري)
  showPrices: boolean      // إخفاء الأسعار وإظهار "تواصل للسعر"

  // Subdomain
  slug: string             // fahad-cars ← يظهر في carlink.sa/fahad-cars
  customDomain?: string    // Pro+
}
```

---

## SEO — لكل صفحة معرض

```typescript
// app/(showroom)/page.tsx
export async function generateMetadata({ params }) {
  const showroom = await getShowroomBySlug(params.slug)
  return {
    title: `${showroom.displayName} — سيارات للبيع`,
    description: `تصفح سيارات ${showroom.displayName} في ${showroom.city}`,
    openGraph: {
      images: [showroom.logoUrl],
    },
  }
}
```

---

## ملاحظة على الـ Build

الـ Route Groups في Next.js 14 (`(marketing)`, `(dashboard)`, `(showroom)`) لا تؤثر على الـ URL — هي تنظيم فقط. التوجيه الفعلي للدومينات يتم كله في `middleware.ts`.
