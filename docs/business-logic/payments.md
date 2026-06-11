# نظام المدفوعات — Payments Architecture

> الحالة: توثيق ومعمارية — لم يبدأ التطوير بعد
> آخر تحديث: يونيو 2026

---

## نموذج العمل — طبقتان للإيراد

```
┌─────────────────────────────────────────────────────────┐
│  الطبقة ١: SaaS Subscription (دائم — كل المعارض)       │
│  المنصة تأخذ اشتراك شهري/سنوي فقط                       │
│  لا تلمس أموال صفقات البيع                               │
└─────────────────────────────────────────────────────────┘
                          +
┌─────────────────────────────────────────────────────────┐
│  الطبقة ٢: Marketplace Commission (اختياري)             │
│  فقط عند تفعيل "عرض السيارة في CarLink Market"           │
│  عمولة % من سعر البيع — قابلة للضبط من لوحة الأدمن     │
└─────────────────────────────────────────────────────────┘
```

---

## الحالتان التشغيليتان

### الحالة أ — معرض يستخدم المنصة كـ SaaS فقط

```
المشتري يدفع للمعرض مباشرة (نقد / تحويل / تمويل)
المنصة لا تدخل في عملية الدفع
المنصة تُسجّل البيع في النظام فقط (إدارة المخزون)
```

لا تكامل مع بوابة دفع في هذه الحالة.

---

### الحالة ب — معرض فعّل CarLink Market

```
المشتري يدفع عبر المنصة
     ↓
بوابة الدفع (Marketplace Gateway)
     ↓ تقسيم تلقائي (Split Payment)
     ├── 95-99% ← حساب المعرض (البائع)
     └──  1-5% ← حساب المنصة (عمولة)
```

العمولة قابلة للضبط من لوحة الأدمن لكل معرض أو كقيمة افتراضية.

---

## البائعون — نوعان

| النوع | التوثيق المطلوب | ملاحظة |
|---|---|---|
| معرض مسجّل | سجل تجاري + IBAN | KYC عبر بوابة الدفع |
| فرد | هوية وطنية + IBAN | نفس الـ KYC |

بوابة الدفع تتولى التحقق (KYC) — المنصة لا تخزّن بيانات بنكية.

---

## بوابات الدفع المرشّحة

### الخيار الأول — Moyasar (مُوصى به للبداية)
```
النوع:    سعودية محلية — مرخّصة من ساما
الميزة:   تكامل API بسيط، دعم محلي، MADA + Visa + Apple Pay
Marketplace: متاح عبر Split Payment API
التوثيق: https://moyasar.com/docs
الملاحظة: الأنسب للبداية — دعم محلي وسهولة تفعيل
```

### الخيار الثاني — PayTabs
```
النوع:    إقليمية — مرخّصة من ساما
الميزة:   حلول Marketplace جاهزة، دعم عربي
Marketplace: PayTabs Marketplace Solution
الملاحظة: خيار قوي إذا احتجنا ميزات marketplace متقدمة
```

### الخيار الثالث — Stripe Connect (مستقبلي)
```
النوع:    عالمية
الميزة:   الأقوى تقنياً، Onboarding تلقائي كامل
Marketplace: Stripe Connect (Standard/Express/Custom)
الملاحظة: للتوسع الإقليمي خارج السعودية
```

---

## إعدادات العمولة في لوحة الأدمن

```typescript
// في جدول showroom_settings أو platform_settings
interface MarketplaceSettings {
  // على مستوى المنصة (القيمة الافتراضية)
  defaultCommissionPct: number      // مثال: 2.5
  minCommissionPct: number          // 0 — يمكن إعفاء معارض بعينها
  maxCommissionPct: number          // 10

  // على مستوى كل معرض (override)
  showroomCommissionPct?: number    // null = يستخدم الافتراضي

  // تفعيل Marketplace لهذا المعرض
  marketplaceEnabled: boolean
  paymentGatewayAccountId?: string  // معرّف البائع في بوابة الدفع
  onboardingStatus: 'pending' | 'active' | 'suspended'
}
```

---

## flow تفعيل CarLink Market لمعرض جديد

```
١. صاحب المعرض يضغط "تفعيل CarLink Market" في الإعدادات
      ↓
٢. المنصة تُوجّهه لصفحة Onboarding بوابة الدفع
   (Hosted Page — ليست صفحتنا)
      ↓
٣. البائع يُدخل: IBAN + هوية/سجل تجاري
      ↓
٤. بوابة الدفع تتحقق وتُعيد Gateway Account ID
      ↓
٥. المنصة تحفظ: onboardingStatus = 'active'
      ↓
٦. السيارات المُفعَّلة للسوق تظهر في CarLink Market
```

---

## flow الدفع عبر CarLink Market

```
المشتري يختار سيارة → يضغط "اشتري الآن"
      ↓
يدفع عبر بوابة الدفع (MADA / Visa / Apple Pay)
      ↓
بوابة الدفع تُمسك المبلغ (Hold)
      ↓
┌── هل تم تأكيد نقل الملكية في أبشر؟ ──┐
│ لا → المبلغ محتجز (لا يُحرَّر)         │
│ نعم ↓                                   │
└─────────────────────────────────────────┘
بوابة الدفع تُقسِّم تلقائياً:
  ├── (100% - عمولة%) → حساب المعرض
  └── عمولة% → حساب المنصة
      ↓
تسجيل البيع في CarTimeline
```

**ملاحظة مهمة:** تحرير الأموال مرتبط بتأكيد نقل الملكية — لا قبل ذلك.

---

## ما يحتاج إضافته لقاعدة البيانات (عند التطوير)

```prisma
// إضافات على Showroom
model Showroom {
  // ... الحقول الحالية ...
  marketplaceEnabled        Boolean  @default(false)
  commissionPct             Decimal? @db.Decimal(5, 2)  // null = افتراضي المنصة
  gatewayAccountId          String?  // معرّف في بوابة الدفع
  gatewayOnboardingStatus   String?  // pending | active | suspended
}

// جدول جديد — Payment Transactions
model PaymentTransaction {
  id              String   @id @default(uuid())
  saleId          String   @unique
  showroomId      String
  buyerName       String
  grossAmount     Decimal  @db.Decimal(12, 2)  // المبلغ الكامل
  commissionPct   Decimal  @db.Decimal(5, 2)
  commissionAmt   Decimal  @db.Decimal(10, 2)  // عمولة المنصة
  netToShowroom   Decimal  @db.Decimal(12, 2)  // صافي للمعرض
  gatewayRef      String?  // رقم العملية في بوابة الدفع
  status          String   // held | released | refunded
  heldAt          DateTime?
  releasedAt      DateTime?
  createdAt       DateTime @default(now())

  sale     Sale     @relation(fields: [saleId], references: [id])
  showroom Showroom @relation(fields: [showroomId], references: [id])

  @@map("payment_transactions")
}

// إضافة على Car
model Car {
  // ... الحقول الحالية ...
  listedOnMarket  Boolean  @default(false)  // هل السيارة معروضة في CarLink Market
  marketPrice     Decimal? @db.Decimal(12, 2)
}
```

---

## اعتبارات الامتثال (Compliance)

| المتطلب | المسؤول |
|---|---|
| KYC للبائعين | بوابة الدفع — ليس المنصة |
| حفظ سجلات المعاملات | المنصة + بوابة الدفع |
| ضريبة المنصة على العمولة | المنصة تُصدر فاتورة ضريبية لكل عمولة |
| ضريبة المعرض على البيع | شأن المعرض — المنصة لا دخل لها |
| ترخيص تشغيل الـ Marketplace | السجل التجاري للمنصة يجب أن يشمل "التجارة الإلكترونية" |

---

## ما لا نبنيه الآن

- لا تكامل مع بوابة دفع في المرحلة الحالية
- لا Onboarding flow
- لا Split Payment API

**المرحلة الحالية:** توثيق القرارات المعمارية فقط، بحيث عند بدء التطوير لا نعيد التفكير من الصفر.
