# المعمارية التقنية — Architecture

---

## الـ Stack المقترح

### Frontend
- **Next.js 14** (App Router) — SSR + ISR للصفحات العامة
- **TypeScript** — كل شيء typed
- **Tailwind CSS** — styling
- **shadcn/ui** — مكوّنات UI الأساسية
- **React Hook Form + Zod** — نماذج + validation
- **TanStack Query** — data fetching وcaching

### Backend
- **Next.js API Routes** أو **separate NestJS** (حسب حجم المشروع)
- **Prisma ORM** — قاعدة البيانات
- **PostgreSQL** — قاعدة البيانات الرئيسية

### Infrastructure
- **Vercel** أو **Railway** — deployment
- **Supabase Storage** أو **AWS S3** — تخزين الصور والملفات
- **Supabase Auth** أو **NextAuth** — المصادقة

---

## هيكل قاعدة البيانات (الجداول الرئيسية)

```sql
-- المنصة
Platform
  Showroom (tenant)
    ShowroomSettings (vat_method, zatca_registered, ...)
    ShowroomUser (owner, manager, staff)

-- كتالوج السيارات (admin-managed)
Brand
  Category (brand_id, body_type)
    Model (category_id)

-- المخزون
Car
  CarImage
  CarDocument
  CarTimelineEvent
  CarExpense (تكاليف إضافية مفصّلة)

-- المبيعات
Sale
  SalePayment
  SaleDocument (عقد البيع)

-- العملاء
Customer
  CustomerInteraction (استفسارات ومتابعات)

-- المراجع
ColorLookup
InspectionTypeLookup
```

---

## Multi-Tenancy

كل طلب يحمل `showroom_id` من الـ JWT token.
كل query في الـ backend تُفلتر تلقائياً بـ `showroom_id`.

```typescript
// middleware مثال
const showroomId = req.user.showroomId
const cars = await prisma.car.findMany({
  where: { showroomId }  // ← isolation إلزامي
})
```

---

## هيكل المجلدات (Monorepo)

```
carlink/
├── apps/
│   ├── web/              ← Next.js (لوحة المعرض)
│   └── admin/            ← Next.js (لوحة الأدمن)
├── packages/
│   ├── shared-ui/        ← SaudiPlate, Timeline, ...
│   ├── shared-types/     ← TypeScript types مشتركة
│   └── shared-utils/     ← toArabicDigits, calcProfit, ...
├── prisma/
│   └── schema.prisma
└── docs/                 ← هذا المجلد
```

---

## نقاط API الرئيسية

```
POST   /api/cars                    ← إضافة سيارة
GET    /api/cars                    ← قائمة المخزون (مع فلاتر)
GET    /api/cars/:id                ← تفاصيل سيارة
PATCH  /api/cars/:id                ← تعديل سيارة
DELETE /api/cars/:id                ← حذف (soft delete)

GET    /api/cars/:id/timeline       ← تايم لاين
POST   /api/cars/:id/documents      ← رفع مستند
DELETE /api/cars/:id/documents/:docId

POST   /api/sales                   ← تسجيل بيع
GET    /api/sales                   ← قائمة المبيعات

GET    /api/reports/vat             ← تقرير الضريبة
GET    /api/reports/inventory       ← تقرير المخزون
GET    /api/reports/sales           ← تقرير المبيعات

-- Admin only
GET    /api/admin/brands
POST   /api/admin/brands
POST   /api/admin/brands/:id/categories
GET    /api/admin/showrooms
PATCH  /api/admin/showrooms/:id/settings
```

---

## قرارات معمارية مهمة

1. **لوحة السيارة كـ shared component** — في `packages/shared-ui` لا تكرار
2. **plateType يُحفظ** — درس مستفاد من مشروع نقله
3. **Soft delete للسيارات** — لا حذف فعلي، `deleted_at` timestamp
4. **Timeline كـ append-only** — لا تعديل ولا حذف في سجلات الأحداث
5. **VAT calculation في الـ backend** — لا نثق بحسابات الـ frontend فقط
