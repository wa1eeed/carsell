# ربط نفاذ الوطني — Nafath Integration

> المرجع التقني: `packages/nafath/nafath-app.yaml`
> مزود الخدمة: شركة إلم (ELM) — elm.sa
> الغرض: التحقق من الهوية الوطنية عند التسجيل وتسجيل الدخول

---

## متى يُستخدم نفاذ

| الحالة | الإلزامية |
|---|---|
| تسجيل حساب جديد (فرد / معرض / وكالة) | ✓ مطلوب لاستخراج الهوية |
| تسجيل الدخول (خيار بديل لكلمة المرور) | اختياري |
| التحقق من هوية البائع (KYC) | ✓ مطلوب |
| تسجيل بيع عقار عالي القيمة | ✓ موصى به |

---

## Flow التسجيل عبر نفاذ

```
المستخدم يضغط "تسجيل بنفاذ الوطني"
  ↓
المنصة تستدعي /stg/api/v2/oidc/session
  ← تستلم: { url, hashedState, requestId }
  ↓
المستخدم يُعاد توجيهه لصفحة نفاذ (url)
  ↓
المستخدم يؤكد في تطبيق نفاذ على جواله
  ← status يصبح: COMPLETED
  ↓
المنصة تستدعي /stg/api/v2/oidc/jwt (بالـ state)
  ← تستلم: { token } ← JWT يحتوي بيانات الهوية
  ↓
المنصة تتحقق من الـ JWT عبر /stg/api/v2/oidc/jwt/valid
  ↓
استخراج البيانات من الـ JWT:
  - رقم الهوية الوطنية
  - الاسم الكامل
  - النوع (مواطن / مقيم / زائر)
  ↓
إنشاء الحساب أو ربطه بحساب موجود
```

---

## Flow MFA (للتطبيق المحمول)

```
POST /api/v1/mfa/request
  Body: { nationalId, service }
  ← { transId, random }
  ↓
عرض الـ random للمستخدم: "أدخل هذا الرقم في تطبيق نفاذ: 42"
  ↓
Polling على POST /api/v1/mfa/request/status
  Body: { nationalId, transId, random }
  ← { status: WAITING | EXPIRED | REJECTED | COMPLETED }
  ↓
عند COMPLETED → المستخدم مُتحقَّق منه
```

---

## البيانات المُستخرجة من JWT نفاذ

بعد التحقق يُستخرج من الـ JWT:

| الحقل | الاستخدام في المنصة |
|---|---|
| `nationalId` | تعبئة `idNumber` في الحساب |
| `name` (AR/EN) | تعبئة الاسم تلقائياً |
| `idType` | تحديد `IndividualType` (مواطن/مقيم/زائر) |
| `gender` | اختياري |
| `dateOfBirth` | اختياري |

---

## متغيرات البيئة

```env
NAFATH_BASE_URL=https://api.elm.sa/nafath
NAFATH_APP_ID=
NAFATH_APP_KEY=
NAFATH_SERVICE_TYPE=CarLink   # اسم الخدمة كما مُسجَّل في إلم
```

---

## ملاحظات تقنية

1. **الـ YAML يشير لـ `/stg/` prefix** — بيئة Staging. بيئة Production تُحدَّد عند التعاقد مع إلم.
2. **JWK للتحقق:** `GET /api/v1/mfa/jwk` يُعيد مفتاح التحقق من الـ JWT — يُخزَّن cached.
3. **Polling strategy:** استطلاع حالة MFA كل 3 ثوانٍ، timeout بعد 2 دقيقة.
4. **نفاذ Web vs App:** Web يستخدم OIDC session+JWT، المحمول يستخدم MFA flow.
