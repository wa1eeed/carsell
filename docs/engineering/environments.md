# بيئات التطوير — Dev / Staging / Production

---

## البيئات الثلاث

```
Developer Machine  →  Dev Branch     → dev.carsell.one      (تلقائي)
                   →  feature/* Branch → [preview URL]     (تلقائي)
                   →  main Branch    → staging.carsell.one   (تلقائي)
                   →  release tag    → carsell.one           (يدوي)
```

| | Dev (local) | Staging | Production |
|---|---|---|---|
| الـ Domain | localhost:3000 | staging.carsell.one | carsell.one |
| DB | PostgreSQL local | DB منفصل على VPS | DB منفصل على VPS |
| Storage | R2 bucket `-dev` | R2 bucket `-staging` | R2 bucket `-prod` |
| Auth | أي إيميل | حسابات اختبار حقيقية | حسابات حقيقية |
| Emails | Console log فقط | Mailtrap أو Resend test | Resend Production |
| Payments | Mock / Sandbox | بوابة Sandbox | بوابة Production |
| Logs | Console | Structured → file | Structured → Sentry + file |

---

## ملفات البيئة

```
.env.example          ← template عام (يُرفع لـ Git)
.env.local            ← بيئة Dev محلية (لا يُرفع لـ Git)
.env.staging          ← بيئة Staging (في Coolify secrets)
.env.production       ← بيئة Production (في Coolify secrets)
```

### متغيرات البيئة — اصطلاح التسمية

```env
# يُحدَّد النوع صراحةً
NODE_ENV=development | staging | production

# كل خدمة بادئة خاصة
DATABASE_URL=
STORAGE_PROVIDER=
R2_ACCOUNT_ID=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# ميزات تجريبية — تُفعَّل في staging أولاً
FEATURE_CUSTOM_DOMAINS=false
FEATURE_NXCARS_MARKET=false
```

---

## Git Branching Strategy

```
main          ← Staging (auto-deploy)
develop       ← تجميع الميزات قبل main
feature/*     ← ميزة جديدة  (feature/car-timeline)
fix/*         ← إصلاح عاجل (fix/vat-calculation)
release/*     ← إعداد إطلاق Production
hotfix/*      ← إصلاح طارئ على Production مباشرة
```

### قاعدة الـ Commit Messages

```
feat: إضافة تايم لاين السيارة
fix: تصحيح حساب ضريبة هامش الربح
chore: تحديث dependencies
docs: توثيق API المدفوعات
refactor: إعادة هيكلة carRepository
test: إضافة tests لـ taxService
```

### لا يُدمَج في main بدون:
1. Code review (حتى لو مطوّر واحد — self-review + checklist)
2. Tests تجتاز
3. Build يجتاز
4. لا Prisma migrations تعارض

---

## CI/CD Pipeline — Coolify على VPS

```yaml
# .coolify/pipeline.yml (مفهومياً)

on_push_to_develop:
  - npm run lint
  - npm run type-check
  - npm run test
  - build preview URL

on_push_to_main:
  - npm run lint
  - npm run type-check
  - npm run test
  - npm run build
  - deploy → staging.carsell.one
  - run: npx prisma migrate deploy  ← تطبيق migrations

on_release_tag:
  - manual approval required
  - deploy → carsell.one
  - run: npx prisma migrate deploy
  - health check
  - rollback if health check fails
```

---

## Database Migrations — القواعد الذهبية

### ١. لا تعديل Migration موجودة أبداً
كل تغيير = migration جديدة. حتى لو خطأ إملائي.

### ٢. Migrations يجب أن تكون Reversible
```typescript
// ✓ migration آمنة — additive
ALTER TABLE cars ADD COLUMN market_price DECIMAL(12,2);

// ⚠ migration خطيرة — destructive — تحتاج خطة rollback
ALTER TABLE cars DROP COLUMN old_field;
```

### ٣. Zero-Downtime Migration Pattern
عند تغيير column اسمه أو نوعه:
```
Step 1: أضف column جديد (مع القديم)
Step 2: اكتب الكود ليكتب في الاثنين
Step 3: migrate البيانات القديمة
Step 4: migration جديدة تحذف القديم
```

### ٤. Staging أولاً دائماً
لا migration تصل Production قبل أن تختبر على Staging بنجاح.

---

## Rollback Plan

### عند مشكلة في Deployment:
```bash
# Coolify → Previous Deployment → Redeploy
# المشروع يرجع للـ image السابقة في ثوانٍ
```

### عند مشكلة في Migration:
```bash
# إذا كانت reversible
npx prisma migrate resolve --rolled-back 20240601_migration_name

# إذا كانت destructive — يرجع من DB backup
# لهذا السبب: backup تلقائي قبل كل migration على Production
```

---

## Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,           // DB
    getStorage().getSignedUrl('test', 'image_preview').catch(() => null), // Storage
  ])

  const db = checks[0].status === 'fulfilled'
  const storage = checks[1].status === 'fulfilled'

  const status = db && storage ? 200 : 503
  return NextResponse.json({ db, storage, env: process.env.NODE_ENV }, { status })
}
```

Coolify يراقب `/api/health` كل 30 ثانية ويوقف الـ traffic عند الفشل.
