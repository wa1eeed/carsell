# إكمال الملف الشخصي — Profile Completion

---

## المبدأ

الملف الشخصي يُكتمل بعد التسجيل بشكل تدريجي.
لا يُجبر المستخدم على إكماله فوراً — يدخل المنصة ويكمل عند الحاجة.

---

## الخطوات الأربع

```
✓ البيانات الأساسية   (تُكمل عند التسجيل)
○ معلومات شخصية      (مطلوب قبل البيع/الشراء)
○ التحقق من الهوية    (مطلوب قبل البيع/الشراء)
○ بيانات المعرض       (للمعارض والوكالات فقط)
```

**نسبة الاكتمال:**
| بعد التسجيل | بعد معلومات شخصية | بعد التحقق | بعد المعرض |
|---|---|---|---|
| ٢٠٪ | ٥٠٪ | ٧٥٪ | ١٠٠٪ |

---

## الخطوة ١ — معلومات شخصية

**حقول مسحوبة من نفاذ (readonly — لا يعدّلها المستخدم):**
```
الاسم الكامل       ← name_ar من JWT نفاذ
رقم الهوية         ← nationalId
نوع الهوية         ← citizen | resident | visitor
```

**حقول يُدخلها المستخدم:**
```
رقم الجوال         * مطلوب (+ OTP توثيق)
المدينة            * مطلوب
البريد الإلكتروني  اختياري
تاريخ الميلاد      اختياري
```

**إذا سجّل بالبريد (لا نفاذ):** كل الحقول قابلة للتعديل.

---

## الخطوة ٢ — التحقق من الهوية (KYC)

### خيار أ: نفاذ الوطني (فوري)
إذا المستخدم سجّل عبر نفاذ → هذه الخطوة مكتملة تلقائياً.
إذا سجّل بالبريد → يمكنه ربط نفاذ لاحقاً للتحقق الفوري.

```
nafathVerified = true
nafathVerifiedAt = now()
```

### خيار ب: رفع المستندات (يدوي — ٢٤ ساعة)
```
رقم الهوية              *
تاريخ انتهاء الهوية     *
صورة الهوية — أمامي    *   (JPG/PDF)
صورة الهوية — خلفي     اختياري
```
يُراجعه الأدمن ويوافق أو يرفض.

```prisma
// حقول KYC على ShowroomUser
kycStatus         String?   // pending | approved | rejected
kycSubmittedAt    DateTime?
kycApprovedAt     DateTime?
kycDocFront       String?   // مسار الملف في R2
kycDocBack        String?
kycRejectReason   String?
```

---

## الخطوة ٣ — بيانات المعرض (للمعارض والوكالات فقط)

**تظهر إذا:** `accountType === SHOWROOM | AGENCY`

```
نوع النشاط          * معرض | وكالة | صالة
اسم المعرض          *
المدينة             *
الحي / الموقع       اختياري
رقم السجل التجاري   *
الرقم الضريبي (VAT) اختياري
واتساب للتواصل      *
رابط إنستغرام       اختياري
شعار المعرض         اختياري (PNG/SVG)
صورة السجل التجاري  * (PDF/JPG)
```

بعد الرفع → الأدمن يراجع السجل التجاري ويفعّل الحساب.

---

## متى تُطلب كل خطوة

```typescript
const requiredSteps: Record<string, string[]> = {
  'car.create':       ['personalInfo', 'identity'],
  'car.list.market':  ['personalInfo', 'identity', 'showroomInfo'],
  'sale.register':    ['personalInfo', 'identity'],
  'deposit.pay':      ['personalInfo', 'identity'],
  'auction.bid':      ['personalInfo', 'identity'],
  'car.browse':       [],   // لا يحتاج شيء
}
// عند محاولة عملية → redirect لإكمال الخطوة الناقصة
// بعد الإكمال → العودة للعملية الأصلية تلقائياً
// مثال: /onboarding?required=identity&next=/cars/new
```

---

## تدفق البيانات من المصادر الخارجية

```
نفاذ JWT
  ↓ extractUserFromJwt()
  ↓ findOrCreateUser()
  ├── name       → showroomUser.name
  ├── nationalId → showroomUser.nationalId
  ├── idType     → showroomUser.idType
  └── nafathVerified = true

VDM (أبشر) — عند سحب بيانات السيارة
  ↓ syncExternalData({ source: 'VDM' })
  ├── registrationExpiry → car.registrationExpiry
  ├── inspectionExpiry   → car.inspectionExpiry
  ├── insuranceExpiry    → car.insuranceExpiry
  ├── insuranceCompany   → car.insuranceCompany
  └── vdmSequenceNumber  → car.vdmSequenceNumber

موجز — عند إصدار التقرير
  ↓ syncExternalData({ source: 'MOJAZ' })
  ├── numberOfOwners → car.numberOfOwners
  └── mojazRequestId → car.mojazRequestId
```

كل تحديث → `CarTimeline` يسجّل تلقائياً.
