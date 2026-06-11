# تسجيل الحساب والـ Onboarding

---

## المبدأ

التسجيل سريع ـ ٣ حقول كافية للبدء.
إكمال الملف الشخصي مطلوب قبل العمليات المالية فقط.

---

## خطوات التسجيل

### الخطوة ١ — نوع الحساب

| النوع | الـ AccountType | الحقول الإضافية في الملف |
|---|---|---|
| فرد | `INDIVIDUAL` | نوع الهوية: مواطن / مقيم / زائر |
| معرض / صالة | `SHOWROOM` | بيانات المعرض + سجل تجاري |
| وكالة / موزع | `AGENCY` | ترخيص وكالة + سجل |
| شركة | `COMPANY` | نوع الشركة: تأمين / بنك / تمويل / أخرى |

---

### الخطوة ٢ — البيانات الأساسية (مسار أ: بريد إلكتروني)

الحقول الإلزامية فقط:
```
- الاسم الكامل         *
- رقم الجوال           *
- البريد الإلكتروني    (اختياري)
- كلمة المرور          *
```

يُنشأ الحساب فوراً. كل بيانات KYC تأتي لاحقاً.

---

### الخطوة ٢ — البيانات الأساسية (مسار ب: نفاذ الوطني)

عند التسجيل عبر نفاذ، الحقول التالية تُعبَّأ تلقائياً وتكون للقراءة فقط:

```
✓ الاسم الكامل         ← من JWT نفاذ (name_ar)
✓ رقم الهوية          ← من JWT نفاذ (nationalId)
✓ نوع الهوية          ← مواطن/مقيم/زائر (من أول رقم)
✓ nafathVerified = true
✓ nafathVerifiedAt = now()
```

يبقى المستخدم يُدخل:
```
- رقم الجوال           *
- كلمة المرور          *
```

---

### الخطوة ٣ — إكمال الملف (مؤجّل)

بعد التسجيل مباشرة تظهر شاشة التقدم:

```
✓ إنشاء الحساب         (مكتمل)
○ بيانات شخصية كاملة  (مطلوب قبل البيع/الشراء)
○ التحقق من الهوية     (مطلوب قبل البيع/الشراء)
○ إعداد المعرض         (للمعارض والوكالات فقط)
```

المستخدم يستطيع **تخطي** والدخول للمنصة كـ browsing mode.

---

## قواعد "إكمال الملف قبل العملية"

```typescript
// middleware يتحقق منه قبل أي عملية
function requireProfileComplete(user: User, action: string): void {
  const requiredForAction: Record<string, string[]> = {
    'car.create':    ['personalInfo', 'identity'],
    'car.sell':      ['personalInfo', 'identity'],
    'car.bid':       ['personalInfo', 'identity'],
    'deposit.pay':   ['personalInfo', 'identity', 'wallet'],
    'market.list':   ['personalInfo', 'identity', 'showroomInfo'],
  }

  const required = requiredForAction[action] ?? []
  const missing  = required.filter(r => !user.completedSteps.includes(r))

  if (missing.length > 0) {
    throw new ProfileIncompleteError(missing)
    // → Redirect: /onboarding?required=identity&next=/cars/new
  }
}
```

---

## ملف الحساب — الحقول حسب نوعه

### كل الحسابات (مشترك)
```
name           الاسم الكامل
phone          رقم الجوال (موثّق بـ OTP)
email          البريد الإلكتروني
accountType    INDIVIDUAL | SHOWROOM | AGENCY | COMPANY
nafathVerified نفاذ مُتحقَّق
nationalId     رقم الهوية (من نفاذ أو يدوي)
```

### الفرد (INDIVIDUAL) — إضافي
```
idType         citizen | resident | visitor
idExpiryDate   انتهاء الهوية
```

### المعرض / الوكالة — إضافي
```
showroomName   اسم المعرض
city           المدينة
commercialReg  رقم السجل التجاري
vatNumber      الرقم الضريبي
```

### الشركة — إضافي
```
companyName    اسم الشركة
companyType    INSURANCE | BANK | FINANCING | OTHER
commercialReg  رقم السجل التجاري
vatNumber      الرقم الضريبي
```

---

## نسبة اكتمال الملف

```typescript
function calcProfileCompletion(user: User): number {
  const steps = [
    { key: 'account',      weight: 20, done: true },
    { key: 'personalInfo', weight: 30, done: !!user.phone && !!user.nationalId },
    { key: 'identity',     weight: 30, done: user.nafathVerified || user.kycVerified },
    { key: 'showroomInfo', weight: 20, done: user.accountType === 'INDIVIDUAL' || !!user.showroomName },
  ]
  return steps.filter(s => s.done).reduce((sum, s) => sum + s.weight, 0)
}
```

---

## OTP للجوال

بعد التسجيل مباشرة:
```
١. إرسال OTP لرقم الجوال
٢. المستخدم يُدخل الكود
٣. phone: verified = true
٤. يمكن تجاوزه مؤقتاً مع تنبيه "الجوال غير موثّق"
```
