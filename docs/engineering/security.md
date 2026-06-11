# معايير الأمن — Security Standards

> متوافق مع: هيئة الأمن السيبراني السعودية (NCA) وسدايا (PDPL)
> المبدأ: آمن بالتصميم — لا إضافة أمن لاحقاً

---

## ١. حماية البيانات الشخصية — PDPL (نظام حماية البيانات الشخصية)

سدايا أصدرت نظام PDPL. الالتزامات الأساسية:

```
✓ جمع البيانات الضرورية فقط (Data Minimization)
✓ إخطار المستخدم بما يُجمَع ولماذا (Privacy Notice)
✓ حق المستخدم في حذف بياناته (Right to Erasure)
✓ عدم مشاركة البيانات مع أطراف ثالثة دون موافقة
✓ تشفير البيانات الحساسة في قاعدة البيانات
✓ سجل التدقيق (Audit Log) — موجود عبر CarTimeline
```

### ما لا نخزّنه:
- بيانات بطاقات الدفع (تبقى عند بوابة الدفع فقط)
- كلمات المرور بدون hashing (bcrypt/argon2)
- بيانات KYC البائعين (تبقى عند بوابة الدفع)

---

## ٢. Authentication & Authorization

### JWT + Session الصحيحة

```typescript
// lib/auth.ts
// NextAuth مع JWT strategy
// Access token: 15 دقيقة
// Refresh token: 7 أيام — يُخزَّن في DB لإمكانية الإلغاء

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 15 * 60 },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.showroomId = user.showroomId
        token.role = user.role
      }
      return token
    },
  },
}
```

### requireAuth — يُستخدم في كل API Route

```typescript
// lib/auth-guard.ts
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new AppError('UNAUTHORIZED', 'غير مصرح', 401)
  return session.user as AuthUser
}

export async function requireRole(
  req: NextRequest,
  roles: Role[]
): Promise<AuthUser> {
  const user = await requireAuth(req)
  if (!roles.includes(user.role))
    throw new AppError('FORBIDDEN', 'لا صلاحية لهذا الإجراء', 403)
  return user
}
```

### Multi-Tenant Isolation — قاعدة لا تُكسر

```typescript
// repositories/car.repository.ts
async findById(carId: string, showroomId: string) {
  // showroomId دائماً في الـ where — لا استثناء
  return prisma.car.findFirst({
    where: { id: carId, showroomId, deletedAt: null }
  })
  // إذا السيارة لمعرض آخر → null → 404
  // لا يعرف المهاجم حتى أن السيارة موجودة
}
```

---

## ٣. Input Validation — Zod على كل مدخل

```typescript
// lib/validations/car.schema.ts
import { z } from 'zod'

export const createCarSchema = z.object({
  brandId:       z.string().uuid(),
  categoryId:    z.string().uuid(),
  modelId:       z.string().uuid(),
  year:          z.number().int().min(1990).max(new Date().getFullYear() + 1),
  purchasePrice: z.number().positive().max(10_000_000),
  sellPrice:     z.number().positive().max(10_000_000).optional(),
  plateNumber:   z.string().regex(/^[\u0600-\u06FF\s]{1,3}\s\d{1,4}$/).optional(),
  // ... إلخ
})

// في API Route
const body = createCarSchema.safeParse(await req.json())
if (!body.success) return fail('VALIDATION_ERROR', body.error.message, 422)
```

---

## ٤. API Security Headers

```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: *.r2.cloudflarestorage.com *.carsell.one",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js يحتاجها
      "connect-src 'self' *.r2.cloudflarestorage.com",
    ].join('; '),
  },
]
```

---

## ٥. Rate Limiting

```typescript
// middleware.ts — قبل كل request
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1m'),
})

// حدود مختلفة لمسارات مختلفة
const limits: Record<string, [number, string]> = {
  '/api/v1/auth':        [10, '1m'],   // 10 محاولات تسجيل دخول/دقيقة
  '/api/v1/cars':        [60, '1m'],   // 60 طلب/دقيقة
  '/api/v1/upload-url':  [10, '1m'],   // 10 رفع/دقيقة
}
```

---

## ٦. تشفير البيانات الحساسة

```typescript
// لا تُخزَّن بيانات بطاقات أو IBAN في DB
// gatewayAccountId = معرّف مشفّر من بوابة الدفع فقط

// للبيانات الحساسة القليلة التي تحتاج تخزين
// نستخدم encryption at rest عبر Prisma middleware
import { createCipheriv, createDecipheriv } from 'crypto'

// Column-level encryption لـ vatNumber مثلاً
```

---

## ٧. Audit Logging — سجل التدقيق

كل عملية حساسة تُسجَّل:

```typescript
// lib/audit.ts
interface AuditEvent {
  action: string          // 'car.created' | 'sale.registered' | 'user.login'
  userId: string
  showroomId?: string
  resourceId?: string
  ipAddress: string
  userAgent: string
  timestamp: DateTime
  metadata?: object
}

// يُستدعى في كل API Route بعد العملية
await audit.log({
  action: 'car.deleted',
  userId: user.id,
  showroomId: user.showroomId,
  resourceId: carId,
  ipAddress: req.ip,
  userAgent: req.headers.get('user-agent') ?? '',
})
```

---

## ٨. Environment Secrets

```
✓ كل الـ secrets في Coolify Environment Variables — لا في الكود
✓ لا .env.production في Git أبداً
✓ .env.example يحتوي keys فقط — لا values
✓ Rotation: secrets تتغير كل 90 يوم على Production
✓ Principle of Least Privilege: كل خدمة تصل فقط لما تحتاجه
```

---

## ٩. Dependencies Security

```bash
# في CI Pipeline — يمنع merge إذا وجد ثغرات critical
npm audit --audit-level=critical

# تحديث دوري — كل شهر
npm outdated
npx npm-check-updates -u
```

---

## ١٠. ما لا نبنيه بأنفسنا

الأمن الصحيح يعني استخدام أدوات متخصصة:

| المشكلة | الحل | لا تبني بنفسك |
|---|---|---|
| Auth | NextAuth.js | لا JWT يدوي |
| Password hashing | bcrypt/argon2 | لا SHA256 |
| File scanning | ClamAV أو Cloudflare | لا regex |
| DDoS protection | Cloudflare Proxy | لا middleware |
| SQL Injection | Prisma ORM | لا raw queries |
| XSS | React escaping + CSP | لا sanitize يدوي |

---

## Checklist قبل كل Feature تصل Production

- [ ] Input validation بـ Zod على كل مدخل
- [ ] `requireAuth` في كل API Route محمية
- [ ] `showroomId` في كل DB query (multi-tenant isolation)
- [ ] لا secrets في الكود أو logs
- [ ] Rate limiting معرّف للـ endpoint
- [ ] Audit log لكل عملية حساسة
- [ ] Tests تغطي الـ authorization scenarios
