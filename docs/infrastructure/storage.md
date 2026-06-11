# التخزين — Storage Infrastructure

> مزود التخزين الحالي: Cloudflare R2
> قابل للتبديل بسطر واحد في `.env`

---

## البنية — Provider Abstraction

```
packages/storage/src/
├── types/
│   └── provider.ts          ← interface StorageProvider (العقد)
├── providers/
│   ├── s3-compatible.ts     ← قاعدة مشتركة لكل مزودي S3
│   ├── r2.ts                ← Cloudflare R2
│   ├── aws-s3.ts            ← AWS S3
│   ├── alibaba-oss.ts       ← Alibaba Cloud OSS
│   └── factory.ts           ← getStorage() ← يقرأ STORAGE_PROVIDER
├── utils.ts                 ← buildCarFileKey, validateFileUpload
├── api-routes.ts            ← Next.js API handlers
├── use-car-upload.ts        ← React hook
└── index.ts                 ← exports
```

**المبدأ:** كل الكود يستدعي `getStorage()` فقط — لا إشارة لـ R2 أو S3 مباشرة خارج مجلد `providers/`.

---

## تبديل المزود

```bash
# الانتقال من R2 إلى AWS S3
STORAGE_PROVIDER=aws   # في .env فقط — لا تغيير في الكود
```

| `STORAGE_PROVIDER` | المزود | متى تستخدمه |
|---|---|---|
| `r2` | Cloudflare R2 | VPS / Coolify (الآن) |
| `aws` | AWS S3 | عند التوسع أو طلب العميل |
| `alibaba` | Alibaba Cloud OSS | أسواق الخليج وآسيا |

---

## هيكل الـ Bucket

```
bucket-name/
├── cars/
│   └── {showroomId}/
│       └── {carId}/
│           ├── images/
│           │   ├── {uuid}_cover.jpg
│           │   └── {uuid}.jpg
│           └── documents/
│               ├── {uuid}_inspection.pdf
│               └── {uuid}_invoice.pdf
└── showrooms/
    └── {showroomId}/
        └── logo.webp
```

---

## Presigned URLs — مدد الصلاحية

| الغرض | المدة | المتغير |
|---|---|---|
| `image_preview` | 1 ساعة | عرض صور في الواجهة |
| `document_view` | 15 دقيقة | فتح PDF في المتصفح |
| `document_download` | 5 دقائق | تحميل مباشر |
| `upload` | 10 دقائق | presigned PUT من المتصفح |

---

## قيود الملفات

| النوع | الصيغ | الحد الأقصى | العدد |
|---|---|---|---|
| صورة | JPG, PNG, WEBP, HEIC | 10 MB | 20 / سيارة |
| مستند | PDF | 20 MB | 10 / سيارة |

---

## Deploy على Coolify (VPS)

```yaml
# في Coolify Environment Variables
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=carsell-prod
```

لا يحتاج تغيير في الكود عند نقل المشروع لخادم مختلف.
