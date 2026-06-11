# حقول البيانات الخارجية — External Data Fields

> كل حقل مُسبَّق بـ prefix يدل على مصدره
> تُطبَّق كـ Prisma migrations منفصلة في المرحلة الأولى من البناء

---

## جدول `ShowroomUser` — حقول نفاذ

```prisma
model ShowroomUser {
  // ... الحقول الحالية ...

  // ── نفاذ الوطني ──────────────────────────
  nationalId           String?   @unique   // رقم الهوية الوطنية / الإقامة
  idType               String?             // citizen | resident | visitor
  idExpiryDate         String?             // انتهاء الهوية (Hijri string)
  nafathVerified       Boolean   @default(false)
  nafathVerifiedAt     DateTime?
  nafathRawData        Json?               // JWT payload الخام من نفاذ
}
```

---

## جدول `Car` — حقول البيانات الخارجية

### من VDM (أبشر)
```prisma
  dataSource           CarDataSource  @default(MANUAL)
  vdmSequenceNumber    String?        // رقم التسلسل — مفتاح Accidents + Mojaz
  vdmLastSyncAt        DateTime?
  vdmRawData           Json?
```

### من موجز
```prisma
  mojazRequestId       String?        // لجلب PDF لاحقاً
  mojazLastReportAt    DateTime?
  mojazRawData         Json?
```

### من مصادر خارجية (VDM / موجز / يقين مستقبلاً)
```prisma
  registrationExpiry   DateTime?      // انتهاء الاستمارة
  inspectionExpiry     DateTime?      // انتهاء الفحص
  insuranceExpiry      DateTime?      // انتهاء التأمين
  insuranceCompany     String?
  insurancePolicyNo    String?
  engineSize           String?
  numberOfOwners       Int?           // عدد الملاك السابقين (موجز)
```

### من Accidents API (علم/بشر)
```prisma
  accidentsLastCheckAt DateTime?
  accidentsCount       Int?
  accidentsCheckYears  Int?
```

---

## قاعدة التحديث

كل تحديث من مصدر خارجي يمر عبر `syncExternalData()`:

```typescript
await syncExternalData({
  carId:   car.id,
  userId:  user.id,
  source:  'VDM',             // أو 'MOJAZ' أو 'ACCIDENTS'
  updates: {
    registrationExpiry: new Date('2026-12-01'),
    insuranceCompany:   'تأمين الراجحي',
    vdmLastSyncAt:      new Date(),
  },
})
// → يحدّث Car + يسجّل في CarTimeline تلقائياً
```

---

## مصادر البيانات حسب الحقل

| الحقل | المصدر الأول | يُستبدل بـ (مستقبلاً) |
|---|---|---|
| `registrationExpiry` | VDM / موجز | يقين (Yaqeen) |
| `inspectionExpiry` | VDM / موجز | يقين |
| `insuranceExpiry` | VDM / موجز | يقين |
| `insuranceCompany` | VDM / موجز | يقين |
| `nationalId` | نفاذ | — |
| `idType` | نفاذ | — |
| `accidentsCount` | بشر (علم) | — |
| `numberOfOwners` | موجز | — |
| `vdmSequenceNumber` | VDM | — |

---

## ربط مصادر البيانات في النظام

```
نموذج الإدخال
  ├── يدوي → car.dataSource = MANUAL
  └── سحب من أبشر (VDM)
        → car.vdmSequenceNumber ← مفتاح كل الاستعلامات
        → car.vdmRawData
        → تحديث registrationExpiry / inspectionExpiry / ...

صفحة تفاصيل السيارة
  ├── تاب "الحوادث" → يستخدم vdmSequenceNumber
  └── زر "تقرير موجز" → يستخدم VIN أو vdmSequenceNumber

عند التحديث من أي مصدر:
  syncExternalData() → Car + CarTimeline تلقائياً
```
