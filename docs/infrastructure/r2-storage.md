# تخزين الملفات — Cloudflare R2

> القرار: Cloudflare R2 لتخزين صور وملفات السيارات
> تاريخ القرار: يونيو 2026

---

## لماذا R2؟

| المعيار | R2 | AWS S3 |
|---|---|---|
| Egress (نقل البيانات للخارج) | **مجاني** | $0.09/GB |
| التخزين | $0.015/GB/شهر | $0.023/GB/شهر |
| CDN | Cloudflare تلقائي | يحتاج CloudFront إضافي |
| الاتصال | ممتاز من السعودية | جيد |
| S3-compatible API | نعم — نفس الـ SDK | — |

---

## هيكل الـ Buckets

```
carlink-prod/
├── cars/
│   ├── {showroom_id}/
│   │   └── {car_id}/
│   │       ├── images/
│   │       │   ├── {uuid}_cover.webp
│   │       │   ├── {uuid}_1.webp
│   │       │   └── {uuid}_2.webp
│   │       └── documents/
│   │           ├── {uuid}_inspection.pdf
│   │           ├── {uuid}_invoice.pdf
│   │           └── {uuid}_insurance.pdf
└── showrooms/
    └── {showroom_id}/
        └── logo.webp
```

**قواعد المسارات:**
- كل ملف يحمل `{uuid}` فريد لمنع التصادم
- الصور تُحوَّل إلى WebP تلقائياً عند الرفع (Cloudflare Images)
- لا مسارات يمكن تخمينها — UUIDs فقط

---

## إعدادات الـ Bucket

```
Bucket name:     carlink-prod
Region:          WEUR (Western Europe — أقرب للخليج)
Public access:   مغلق ← presigned URLs فقط
CORS:            مفعّل للدومين فقط
Lifecycle rules: حذف الملفات المؤقتة بعد 24h
```

---

## Presigned URLs

كل رابط ملف يُولَّد مؤقتاً من الـ backend — لا روابط دائمة مكشوفة.

```typescript
// مدة الصلاحية حسب الاستخدام
const EXPIRY = {
  image_preview:  60 * 60,        // 1 ساعة — عرض في الواجهة
  document_view:  60 * 15,        // 15 دقيقة — عرض PDF
  document_download: 60 * 5,      // 5 دقائق — تحميل
  upload_url:     60 * 10,        // 10 دقائق — رفع من المتصفح
}
```

---

## قيود الملفات

### الصور
| المعيار | القيمة |
|---|---|
| الصيغ المقبولة | JPG, PNG, HEIC, WEBP |
| الحد الأقصى للحجم | 10 MB |
| الحد الأقصى للعدد | 20 صورة / سيارة |
| الدقة الموصى بها | 2000×1500 px |
| التحويل التلقائي | → WebP (85% quality) |

### المستندات
| المعيار | القيمة |
|---|---|
| الصيغ المقبولة | PDF فقط |
| الحد الأقصى للحجم | 20 MB |
| الحد الأقصى للعدد | 10 ملفات / سيارة |

---

## متغيرات البيئة المطلوبة

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=carlink-prod
R2_PUBLIC_DOMAIN=cdn.carlink.com   # Custom domain على R2
```

---

## ملاحظات أمنية

- الـ bucket لا يُفتح للعموم أبداً — presigned URLs فقط
- كل رفع يمر عبر الـ backend (validation قبل الوصول لـ R2)
- المسارات تتضمن `showroom_id` — isolation بين المعارض
- الملفات المحذوفة تُحذف من R2 فوراً (soft delete في DB + hard delete في R2)
