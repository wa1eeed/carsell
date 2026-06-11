# قابلية التوسع والصيانة — Scalability & Maintainability

---

## مبدأ Open/Closed

الكود مفتوح للإضافة، مغلق للتعديل.

```typescript
// ✗ إضافة ميزة تعدّل الكود الحالي
function calcVat(car: Car, method: string) {
  if (method === 'full') { ... }
  if (method === 'margin') { ... }
  // كل ميزة جديدة تعدّل هنا — خطر
}

// ✓ إضافة ميزة تضيف strategy جديدة فقط
interface VatStrategy {
  calculate(car: Car): VatResult
}

class FullPriceVat implements VatStrategy { ... }
class ProfitMarginVat implements VatStrategy { ... }
// ميزة جديدة → class جديدة — لا تعديل للقديم
```

---

## Feature Flags

ميزات تجريبية تُفعَّل في Staging قبل Production:

```typescript
// lib/features.ts
export const features = {
  CUSTOM_DOMAINS:    process.env.FEATURE_CUSTOM_DOMAINS === 'true',
  NXCARS_MARKET:     process.env.FEATURE_NXCARS_MARKET === 'true',
  PDF_CONTRACTS:     process.env.FEATURE_PDF_CONTRACTS === 'true',
  WHATSAPP_NOTIFY:   process.env.FEATURE_WHATSAPP_NOTIFY === 'true',
}

// الاستخدام
if (features.NXCARS_MARKET) {
  // عرض زر "أضف للسوق"
}
```

تدريجياً:
```
Dev    → FEATURE_X=true
Staging → FEATURE_X=true (اختبار حقيقي)
Prod   → FEATURE_X=false  (hidden)
Prod   → FEATURE_X=true   (عند الإطلاق الرسمي)
```

---

## Caching Strategy

```typescript
// ١. React Query للـ client-side (TTL حسب نوع البيانات)
const { data: cars } = useQuery({
  queryKey: ['cars', showroomId, filters],
  queryFn: () => fetchCars(filters),
  staleTime: 30 * 1000,          // 30 ثانية — مخزون يتغير
})

// ٢. Next.js Cache للـ server-side
export const revalidate = 60  // صفحة المعرض العامة — تتجدد كل دقيقة

// ٣. لا تكسر cache عند تغيير بيانات
await revalidatePath(`/${showroomSlug}`)  // بعد إضافة/حذف سيارة
```

---

## Pagination — دائماً على الـ server

```typescript
// ✗ خطأ — جلب كل شيء
const cars = await prisma.car.findMany({ where: { showroomId } })

// ✓ صح — pagination إلزامية
async findByShowroom(showroomId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize
  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where: { showroomId, deletedAt: null },
      skip,
      take: Math.min(pageSize, PAGINATION.MAX_PAGE_SIZE),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.car.count({ where: { showroomId, deletedAt: null } }),
  ])
  return { cars, total, pages: Math.ceil(total / pageSize) }
}
```

---

## Database Performance

```prisma
// Indexes على الحقول المستخدمة في where + orderBy
model Car {
  @@index([showroomId, status])           // الاستعلام الأكثر شيوعاً
  @@index([showroomId, createdAt])        // sorting
  @@index([showroomId, listedOnMarket])   // CarSell Live filter
  @@index([plateNumber])                  // بحث باللوحة
}

model CarTimeline {
  @@index([carId, createdAt])             // جلب تايم لاين سيارة
}
```

---

## Background Jobs — لا تُبطئ الـ API Response

عمليات تستغرق وقتاً تُنفَّذ خارج الـ request:

```typescript
// ✗ PDF generation في الـ API Response — يبطئ
async function confirmSale(saleId: string) {
  await generatePDF(saleId)  // 3-5 ثوانٍ
  return sale
}

// ✓ Queue job — الـ API يرجع فوراً
async function confirmSale(saleId: string) {
  await queue.add('generate-pdf', { saleId })  // milliseconds
  return sale  // PDF يُرسَل للمستخدم لاحقاً
}

// Jobs مقترحة
// generate-pdf: عقود البيع
// send-notification: واتساب + إيميل
// revalidate-showroom: إعادة بناء cache الواجهة
```

أدوات للـ Queue على VPS: **BullMQ** (Redis-based) أو **pg-boss** (PostgreSQL-based — أبسط).

---

## Monitoring & Observability

```typescript
// lib/logger.ts — Structured logging
import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { env: process.env.NODE_ENV },
})

// الاستخدام — لا console.log في الكود
logger.info({ carId, showroomId }, 'car.created')
logger.error({ error, carId }, 'car.create.failed')
logger.warn({ userId, ip }, 'rate.limit.exceeded')
```

### Metrics للمراقبة:
- Response time لكل API endpoint
- Error rate (هدف: < 0.1%)
- DB query time (هدف: < 100ms)
- Storage upload success rate
- Active sessions لكل بيئة

---

## Testing Strategy

```
Unit Tests     → Services + Utils + Validators  (jest)
Integration    → API Routes + Repositories       (jest + test DB)
E2E            → User flows حرجة               (Playwright)
```

### ما يُختبر دائماً:
```typescript
// ✓ Tax calculation — حساس مالياً
describe('TaxService', () => {
  it('يحسب الضريبة على هامش الربح بشكل صحيح', () => {
    const result = taxService.calculate({
      sellPrice: 345000,
      purchasePrice: 290000,
      method: 'PROFIT_MARGIN',
    })
    expect(result.vatAmount).toBe(8250)    // (345k-290k) * 15%
    expect(result.netProfit).toBe(42250)
  })
})

// ✓ Multi-tenant isolation
it('لا يعيد سيارة معرض آخر', async () => {
  const car = await carRepository.findById(otherShowroomCarId, myShowroomId)
  expect(car).toBeNull()
})
```

Coverage هدف: 70%+ على Services و Repositories.

---

## أداء قاعدة البيانات — الفهارس (Database Performance)

> **المبدأ الحاكم: المتانة أولاً.** كل query لازم يكون مدعوماً بفهرس.

### القاعدة الذهبية

أي حقل يظهر في `where` أو `orderBy` أو `join` → **يحتاج فهرس**.

```prisma
// ✗ جدول بدون فهرس على حقل الفلترة
model Car {
  showroomId String
  status     CarStatus
  // كل query على (showroomId, status) = full table scan لما تكبر
}

// ✓ فهرس مركّب على مسار الـ query الساخن
model Car {
  showroomId String
  status     CarStatus
  deletedAt  DateTime?
  @@index([showroomId, status, deletedAt])  // inventory/dashboard list
  @@index([status, deletedAt])              // public marketplace
  @@index([brandId])                        // filters
}
```

### الفهارس الحالية (مرجع)

| الجدول | الفهرس | السبب |
|---|---|---|
| `cars` | `(showroomId, status, deletedAt)` | قائمة المخزون + الداشبورد |
| `cars` | `(status, deletedAt)` | السوق العام CarSell Live |
| `cars` | `brandId`, `categoryId` | فلاتر السوق والمعرض |
| `cars` | `(mediaScheduledDeleteAt, mediaDeletedAt)` | cron تنظيف الميديا |
| `car_images`, `car_documents` | `carId` | تحميل المعرض/المستندات |
| `car_timeline` | `(carId, createdAt)` | تبويب التايملاين |
| `customers` | `showroomId` | قائمة العملاء |
| `sales` | `(showroomId, soldAt)` | المبيعات + التقارير |

### قاعدة ترتيب الأعمدة في الفهرس المركّب

الأكثر انتقائية (selectivity) أولاً، ثم حقل الترتيب آخراً:
```
(showroomId, status, deletedAt)  ✓  — showroomId يقلّص النتائج كثيراً
(deletedAt, status, showroomId)  ✗  — deletedAt ضعيف الانتقائية
```

### كيف تتحقق أن الفهرس يُستخدم

```sql
EXPLAIN SELECT * FROM cars
WHERE "showroomId"='...' AND status='FOR_SALE' AND "deletedAt" IS NULL;
-- ابحث عن "Index Scan" أو "Bitmap Index Scan" (لا "Seq Scan" على جدول كبير)
```

> ملاحظة: على الجداول الصغيرة (<100 صف) Postgres يختار Seq Scan عمداً — هذا صحيح،
> والفهرس يُفعَّل تلقائياً عند النمو. للتأكد من وجوده: `SET enable_seqscan=off;` ثم EXPLAIN.

### قبل أي migration جديد — اسأل

- [ ] هل أضفت حقلاً يُستخدم في الفلترة؟ → أضف فهرساً
- [ ] هل الـ migration يقفل جدولاً كبيراً؟ → استخدم `CREATE INDEX CONCURRENTLY` في الإنتاج
- [ ] هل يحذف عموداً مفهرساً؟ → تأكد لا يكسر queries أخرى

### ما بعد VPS الواحد (خطة النمو)

| المرحلة | الإجراء |
|---|---|
| نمو | فصل القاعدة لـ VPS مستقل |
| توسّع | Connection pooling (PgBouncer) + read replica للتقارير |
| كبير | AWS RDS / Alibaba ApsaraDB (تغيير `DATABASE_URL` فقط) |
