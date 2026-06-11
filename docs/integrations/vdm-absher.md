# ربط VDM — Vehicle Data Management (أبشر)

> المرجع التقني: `packages/vdm/vehicle-vdm-apis.yaml`
> الغرض: سحب بيانات السيارة تلقائياً من منصة أبشر عبر VDM API

---

## طريقتا إدخال السيارة

```
┌─────────────────────────────────────────────────────────┐
│  نموذج إضافة سيارة جديدة                                │
│                                                         │
│  كيف تريد إضافة السيارة؟                                │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │  📝 إدخال يدوي  │   │  🔗 سحب من أبشر (VDM)  │   │
│  │  تعبئة الحقول   │   │  رقم الهيكل أو رقم      │   │
│  │  يدوياً         │   │  التسلسل ← يجلب تلقائياً │   │
│  └──────────────────┘   └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## VDM API — ما يوفّره

### Endpoint ١: بحث بـ VIN
```
GET /api/v1/vehicles/vehicle-info?vin={VIN}
Headers: client-id, app_id, app_key
```

### Endpoint ٢: بحث برقم التسلسل (رقم أبشر)
```
POST /api/v2/vehicle/basic-info
Headers: client-id, app_id, app_key
Body: { vehicleSequenceNumber: "1234567890" }
```

**يعيد:** معلومات السيارة الأساسية (البراند، الفئة، الموديل، السنة، اللون، رقم الهيكل...)

---

## حقل `dataSource` على جدول `Car`

```prisma
enum CarDataSource {
  MANUAL          // إدخال يدوي
  VDM_ABSHER      // مسحوب من أبشر عبر VDM
  VDM_VIN         // مسحوب بـ VIN عبر VDM
}

model Car {
  // ... الحقول الحالية ...
  dataSource        CarDataSource  @default(MANUAL)
  vdmLastSyncAt     DateTime?      // آخر مزامنة مع VDM
  vdmRawData        Json?          // البيانات الخام من VDM (للمراجعة)
  // ...
}
```

---

## منطق زر "تحديث من أبشر"

يظهر في صفحة تفاصيل السيارة **فقط إذا:**
```typescript
const showVdmUpdateBtn =
  car.dataSource === 'MANUAL' &&   // أُدخلت يدوياً
  car.vin != null                   // عندها رقم هيكل
```

لا يظهر إذا:
- السيارة مسحوبة مسبقاً من VDM
- لا يوجد VIN مدخل

---

## Flow كامل

### ١. عند إضافة سيارة جديدة
```
المستخدم يختار "سحب من أبشر"
  ↓
يُدخل: رقم الهيكل (VIN) أو رقم التسلسل
  ↓
المنصة تستدعي VDM API
  ↓
البيانات تُعبّأ في النموذج تلقائياً (قابلة للتعديل)
  ↓
المستخدم يراجع ويضيف السعر والصور
  ↓
car.dataSource = 'VDM_VIN' أو 'VDM_ABSHER'
```

### ٢. عند ضغط "تحديث من أبشر" (سيارة يدوية)
```
المستخدم يضغط الزر في صفحة التفاصيل
  ↓
تأكيد: "سيتم تحديث البيانات من أبشر — المتابعة؟"
  ↓
المنصة تستدعي VDM API بالـ VIN الموجود
  ↓
مقارنة البيانات: ما تغيّر vs ما في النظام
  ↓
عرض الفروقات للمستخدم (diff view)
  ↓
المستخدم يؤكد → تُحدَّث البيانات
  ↓
car.dataSource = 'VDM_VIN'
car.vdmLastSyncAt = now()
تسجيل حدث في CarTimeline: "تحديث البيانات من أبشر"
```

---

## البيانات المتوقعة من VDM

بناءً على الـ YAML (الحقول الفعلية `additionalProperties: true` — تُحدَّد عند الاختبار):

| حقل VDM المتوقع | حقل في جدول Car |
|---|---|
| make / brand | brandId (lookup) |
| model | categoryId + modelId (lookup) |
| year | year |
| color | colorExt |
| vin | vin |
| bodyType | bodyType |
| fuelType | fuelType |
| transmission | transmission |
| engineSize | engineSize (حقل جديد) |
| registrationExpiry | registrationExpiry |
| plateNumber | plateNumber |
| plateType | plateType |

---

## متغيرات البيئة المطلوبة

```env
VDM_BASE_URL=https://api.vdm.gov.sa
VDM_CLIENT_ID=
VDM_APP_ID=
VDM_APP_KEY=
```

---

## ملاحظات تقنية

1. **الـ YAML يُشير لـ `additionalProperties: true`** في كل schemas — الحقول الفعلية غير محددة. عند الاختبار الحقيقي مع الـ API يُحدَّث هذا الملف.

2. **Mapping البراند:** VDM يعيد نص (مثلاً "Toyota") — المنصة تحتاج lookup جدول `brands` للحصول على `brandId`. إذا البراند غير موجود → يُضاف تلقائياً أو يُطلب من الأدمن.

3. **Rate Limiting:** VDM API حكومي — يحتمل وجود حدود. كل استدعاء يُسجَّل.

4. **Caching:** نتيجة VDM لنفس الـ VIN تُخزَّن مؤقتاً `vdmRawData` لتجنب استدعاءات متكررة.

5. **Fallback:** إذا VDM غير متاح → النموذج يكمل يدوياً مع رسالة واضحة.

---

## ملاحظة: vehicleSequenceNumber

رقم التسلسل (`vehicleSequenceNumber`) يُعيده VDM عند السحب من أبشر ويُحفظ في `car.vdmRawData`. هذا الرقم مطلوب لاستعلام الحوادث (Accidents API). إذا لم يكن موجوداً → يظهر للمستخدم "استخدم سحب من أبشر أولاً".
