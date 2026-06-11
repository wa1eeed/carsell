# CarSell — دليل المشروع لـ Claude

> اقرأ هذا الملف كاملاً في بداية كل جلسة تطوير.
> أي كود يُكتب يجب أن يلتزم بكل ما فيه.

---

## المشروع

**CarSell** — سوق السيارات في السعودية والخليج.
CarSell — سوق السيارات في السعودية والخليج + سوق عام للبيع والشراء.
الدومين: **carsell.one** | carsell.one | @carsell

---

## الـ Stack

| الطبقة | التقنية |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| قاعدة البيانات | PostgreSQL + Prisma ORM |
| التخزين | Cloudflare R2 (قابل للتبديل — `STORAGE_PROVIDER` في `.env`) |
| Auth | NextAuth.js |
| Validation | Zod |
| Deploy | VPS via Coolify |
| Language | TypeScript strict — لا `any` |

---

## هيكل المجلدات

```
carlink/
├── CLAUDE.md                   ← هذا الملف
├── .env.example
├── prisma/schema.prisma        ← 14 جداول — اقرأه أولاً
├── apps/web/
│   ├── middleware.ts           ← توجيه الدومينات الثلاثة
│   └── app/
│       ├── (marketing)/        ← carsell.one
│       ├── (dashboard)/        ← app.carsell.one
│       ├── (showroom)/         ← {slug}.carsell.one
│       └── (market)/           ← carsell.one/market
├── packages/storage/src/
│   ├── types/provider.ts       ← StorageProvider interface
│   ├── providers/factory.ts    ← getStorage() ← نقطة الدخول
│   └── ...
└── docs/
    ├── engineering/
    │   ├── code-standards.md   ← ★ اقرأ قبل أي كود
    │   ├── security.md         ← ★ اقرأ قبل أي API
    │   ├── environments.md     ← Dev/Staging/Production
    │   └── scalability.md      ← Patterns + Testing
    ├── architecture/
    │   └── frontend.md         ← Domain routing
    ├── business-logic/
    │   ├── tax-rules.md        ← VAT — حساس جداً
    │   ├── payments.md         ← SaaS vs CarSell Live
    │   ├── car-lifecycle.md
    │   └── pricing-model.md
    ├── components/
    │   └── saudi-plate.md
    └── infrastructure/
        └── storage.md
```

---

## القرارات المعمارية — لا تتجاوزها

### ١. Repository Pattern إلزامي
لا `prisma.*` في API Routes. كل DB queries في `repositories/`.
```typescript
// ✓ في API Route
const car = await carRepository.findById(carId, user.showroomId)
// ✗ ممنوع في API Route
const car = await prisma.car.findFirst({ where: { id: carId } })
```

### ٢. Multi-Tenant Isolation — لا استثناء
كل query تتضمن `showroomId` من الـ JWT:
```typescript
// showroomId دائماً في الـ where
where: { id: carId, showroomId: user.showroomId, deletedAt: null }
```

### ٣. Storage عبر `getStorage()` فقط
لا استدعاء R2/S3 مباشرة خارج `packages/storage/src/providers/`.
```typescript
const storage = getStorage()  // يقرأ STORAGE_PROVIDER من .env
```

### ٤. `plateType` يُحفظ دائماً
`car.plateType` في DB. درس مستفاد من مشروع سابق.

### ٥. Soft Delete فقط
`car.deletedAt = now()` — لا `DELETE` فعلي للسيارات.

### ٦. Timeline Append-Only
`car_timeline` لا يُعدَّل ولا يُحذف أبداً.

### ٧. VAT في الـ Backend دائماً
حساب الضريبة server-side فقط — لا نثق بالـ frontend.

### ٨. CarSell Live اختياري
المعرض يدفع اشتراك ثابت. العمولة فقط عند تفعيل Market.
انظر: `docs/business-logic/payments.md`

---

## البيئات الثلاث

| | Dev | Staging | Production |
|---|---|---|---|
| Domain | localhost:3000 | staging.carsell.one | carsell.one |
| Branch | feature/* | main | release tag |
| Deploy | يدوي | تلقائي | يدوي + approval |

لا migration تصل Production قبل Staging.

---

## Checklist قبل كل Commit

- [ ] لا `any` في TypeScript
- [ ] Zod validation على كل API input
- [ ] `requireAuth` في كل محمية API
- [ ] `showroomId` في كل DB query
- [ ] لا secrets في الكود
- [ ] لا `console.log` — استخدم `logger`
- [ ] Constants من `lib/constants.ts` لا magic numbers
- [ ] Tests على الـ business logic الجديد

---

## الملفات الأولى عند استئناف العمل

1. `prisma/schema.prisma` — هيكل البيانات
2. `docs/engineering/code-standards.md` — معايير الكود
3. `docs/engineering/security.md` — قواعد الأمن
4. `docs/business-logic/tax-rules.md` — منطق الضريبة

---

## البدء السريع

```bash
cp .env.example .env.local
# عبّئ DATABASE_URL و R2_* و NEXTAUTH_SECRET

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

---

## Developer Portal

```
developers.carsell.one
├── Quick Start
├── Authentication (API Key + OAuth2)
├── API Reference (/cars, /sales, /catalog, /showrooms, /webhooks)
├── Guides
└── Sandbox (reset كل 24h)
```

التوثيق الكامل: `docs/developer-portal/api-reference.md`

API Keys يديرها البائع من: `app.carsell.one/settings/developer`

---

## التسجيل والـ Onboarding

```
docs/screens/registration-onboarding.md  ← خطوات التسجيل + مسار نفاذ
docs/screens/profile-completion.md       ← إكمال الملف + KYC + متى يُطلب
docs/integrations/external-data-fields.md ← كل الحقول الخارجية (نفاذ/VDM/موجز)
```

**قاعدة:** لا عملية مالية قبل إكمال `personalInfo + identity`.
المنطق في: `requiredSteps` بـ `docs/screens/profile-completion.md`.

---

## التصميم — Design System (إلزامي)

**قبل بناء أي واجهة:** اقرأ `docs/design/design-system.md`

```
الألوان:  Navy #0F3460 (primary) + Gold #C9A84C (accent)
الخط:     IBM Plex Sans Arabic
الأيقونات: Lucide React حصراً
الاتجاه:  RTL على كل شيء
الـ Sidebar: دائماً Navy مع نص أبيض
الأسعار: دائماً Gold + font-mono
```

---

## اللغة وتعدد اللغات — i18n

```
الأساس:  English (en) — اللغة الأصلية للكود
الثانية: Arabic  (ar) — نسخة كاملة مع RTL
المكتبة: next-intl
الافتراضي: ar (عربي)
```

**RTL/LTR:**
```tsx
// layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

**استثناءات LTR دائماً (بغض النظر عن اللغة):**
```css
.vin, .plate-number, .price-number, .phone-number, .font-mono {
  direction: ltr !important;
}
```

**لا نصوص مباشرة في الكود:**
```tsx
// ✗   <button>إضافة سيارة</button>
// ✓   <button>{t('actions.addCar')}</button>
```

الملف المرجعي الكامل: `docs/engineering/code-standards.md` — قسم i18n
