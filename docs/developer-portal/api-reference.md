# Developer Portal — بوابة المطوّرين

> الرابط: developers.carsell.one
> الهدف: تمكين المطوّرين وأصحاب المنصات من الربط مع CarSell API

---

## لماذا Developer Portal؟

- معارض السيارات قد تملك أنظمة ERP أو موقع خاص تريد ربطه
- منصات تجميع (aggregators) مثل سيارة، هتلك تريد استيراد المخزون
- تطبيقات الجوال من طرف ثالث
- روبوتات واتساب وأنظمة CRM خارجية
- أتمتة العمليات عبر Webhooks

---

## الصفحات الرئيسية للـ Portal

```
developers.carsell.one/
├── /                        ← نظرة عامة + Quick Start
├── /authentication          ← OAuth2 + API Keys
├── /reference               ← API Reference الكامل
│   ├── /cars                ← Cars endpoints
│   ├── /inventory           ← Inventory management
│   ├── /sales               ← Sales endpoints
│   ├── /showroom            ← Showroom public data
│   └── /webhooks            ← Webhooks reference
├── /guides                  ← دلائل عملية
│   ├── /quick-start
│   ├── /import-inventory
│   └── /webhooks-guide
├── /sdks                    ← SDKs مستقبلياً
└── /sandbox                 ← بيئة تجريبية
```

---

## Authentication — طريقتان

### ١. API Key (للمعارض — Server to Server)
```http
GET /api/v1/cars
Authorization: Bearer nxk_live_xxxxxxxxxxxxxxxxxxxx
X-Showroom-ID: showroom_abc123
```

أنواع الـ keys:
```
nxk_live_xxx   ← Production
nxk_test_xxx   ← Sandbox
```

### ٢. OAuth 2.0 (للتطبيقات التي تتصرف بالنيابة عن المعرض)
```
GET /oauth/authorize?client_id=xxx&scope=inventory:read sales:read&response_type=code
POST /oauth/token
```

Scopes متاحة:
```
inventory:read     ← قراءة المخزون
inventory:write    ← إضافة/تعديل سيارات
sales:read         ← قراءة المبيعات
sales:write        ← تسجيل مبيعات
showroom:read      ← بيانات المعرض العامة
webhooks:manage    ← إدارة الـ webhooks
```

---

## API Reference الكامل

### Base URL
```
Production:  https://api.carsell.one/v1
Sandbox:     https://sandbox-api.carsell.one/v1
```

### Response Format الموحّد
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 147,
    "pages": 8
  }
}

// خطأ
{
  "success": false,
  "error": {
    "code": "CAR_NOT_FOUND",
    "message": "السيارة غير موجودة",
    "details": {}
  }
}
```

---

### Cars Endpoints

#### `GET /cars`
جلب قائمة السيارات في المخزون

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | رقم الصفحة |
| `pageSize` | integer | 20 | عدد النتائج (max 100) |
| `status` | string | `for_sale` | `draft\|for_sale\|reserved\|sold\|all` |
| `brandId` | uuid | — | فلتر البراند |
| `categoryId` | uuid | — | فلتر الفئة |
| `minPrice` | number | — | سعر أدنى |
| `maxPrice` | number | — | سعر أعلى |
| `year` | integer | — | سنة الصنع |
| `listedOnMarket` | boolean | — | معروضة في CarSell Live |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "car_abc123",
      "brand": { "id": "...", "nameAr": "تويوتا", "nameEn": "Toyota" },
      "category": { "id": "...", "nameAr": "لاند كروزر", "nameEn": "Land Cruiser" },
      "model": { "id": "...", "name": "VXR" },
      "year": 2023,
      "colorExt": "أبيض لؤلؤي",
      "odometer": 12000,
      "status": "for_sale",
      "displayMode": "fixed_price",
      "sellPrice": 345000,
      "plateNumber": "ح ن ط 7653",
      "plateType": "private",
      "coverImageUrl": "https://cdn.carsell.one/...",
      "createdAt": "2026-06-02T09:14:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 34, "pages": 2 }
}
```

---

#### `GET /cars/{carId}`
تفاصيل سيارة واحدة

**Response يضيف:**
```json
{
  "data": {
    "...fields above...",
    "images": [
      { "id": "...", "url": "https://...", "isCover": true }
    ],
    "documents": [
      { "id": "...", "docType": "INSPECTION", "fileName": "فحص.pdf" }
    ],
    "expenses": [
      { "description": "فحص", "amount": 1500 }
    ],
    "financials": {
      "purchasePrice": 290000,
      "extraCosts": 4500,
      "totalCost": 294500,
      "sellPrice": 345000,
      "vatAmount": 8250,
      "netProfit": 42250,
      "profitPct": 14.36,
      "vatMethod": "PROFIT_MARGIN"
    }
  }
}
```

---

#### `POST /cars`
إضافة سيارة جديدة

**Body:**
```json
{
  "brandId": "uuid",
  "categoryId": "uuid",
  "modelId": "uuid",
  "year": 2023,
  "carType": "used_qualified",
  "colorExt": "أبيض لؤلؤي",
  "odometer": 12000,
  "fuelType": "PETROL",
  "transmission": "AUTOMATIC",
  "purchasePrice": 290000,
  "sellPrice": 345000,
  "displayMode": "fixed_price",
  "status": "for_sale",
  "plateNumber": "ح ن ط 7653",
  "plateType": "private",
  "notes": "سيارة بحالة ممتازة"
}
```

---

#### `PATCH /cars/{carId}`
تحديث بيانات سيارة — يقبل partial update

#### `DELETE /cars/{carId}`
حذف سيارة (Soft Delete)

---

### Inventory Endpoints

#### `GET /inventory/stats`
إحصائيات المخزون
```json
{
  "data": {
    "total": 34,
    "byStatus": {
      "draft": 2, "for_sale": 22,
      "reserved": 6, "sold": 4
    },
    "totalValue": 8750000,
    "avgDaysInInventory": 18
  }
}
```

---

### Catalog Endpoints (Public — لا auth)

#### `GET /catalog/brands`
قائمة البراندات المتاحة في المنصة

#### `GET /catalog/brands/{brandId}/categories`
فئات براند محدد

#### `GET /catalog/categories/{categoryId}/models`
موديلات فئة محددة

---

### Showroom Endpoints (Public)

#### `GET /showrooms/{slug}`
بيانات معرض عامة للعرض في الواجهات الخارجية
```json
{
  "data": {
    "slug": "fahad-cars",
    "displayName": "معرض الفهد للسيارات",
    "city": "الرياض",
    "logoUrl": "https://...",
    "whatsappNumber": "966500000000",
    "totalCars": 34
  }
}
```

#### `GET /showrooms/{slug}/cars`
سيارات معرض معين — للعرض في مواقع خارجية
نفس parameters الـ `GET /cars` + يعيد السيارات `for_sale` فقط بشكل افتراضي.

---

### Sales Endpoints

#### `GET /sales`
قائمة المبيعات مع فلاتر تاريخ

#### `POST /sales`
تسجيل عملية بيع

#### `GET /sales/{saleId}`
تفاصيل صفقة بيع

---

### Webhooks

#### `POST /webhooks`
تسجيل Webhook endpoint

**Body:**
```json
{
  "url": "https://your-system.com/webhook",
  "events": ["car.created", "car.sold", "car.status_changed"],
  "secret": "your_webhook_secret"
}
```

**الأحداث المتاحة:**
```
car.created           ← سيارة أضيفت
car.updated           ← بيانات سيارة تغيّرت
car.status_changed    ← حالة السيارة تغيّرت
car.sold              ← سيارة بيعت
car.deleted           ← سيارة حُذفت
sale.created          ← صفقة بيع جديدة
```

**Webhook Payload:**
```json
{
  "event": "car.sold",
  "timestamp": "2026-06-02T11:32:00Z",
  "showroomId": "showroom_abc",
  "data": {
    "carId": "car_xyz",
    "saleId": "sale_123",
    "sellPrice": 345000
  }
}
```

**التحقق من الـ signature:**
```javascript
const signature = req.headers['x-carsell-signature']
const expected = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex')
if (signature !== expected) return res.status(401).send('Invalid signature')
```

---

## Rate Limits

| Tier | الحد | الباقة |
|---|---|---|
| Free / Sandbox | 100 req/hour | — |
| Basic API | 1,000 req/hour | Basic+ |
| Pro API | 10,000 req/hour | Pro+ |
| Enterprise | Custom | Enterprise |

---

## بيئة الـ Sandbox

- Base URL: `https://sandbox-api.carsell.one/v1`
- بيانات تجريبية مُعبَّأة مسبقاً (20 سيارة نموذجية)
- لا تأثير على بيانات حقيقية
- Reset تلقائي كل 24 ساعة

---

## SDKs — خارطة طريق

| اللغة | الحالة |
|---|---|
| JavaScript/TypeScript | مرحلة ١ |
| Python | مرحلة ٢ |
| PHP | مرحلة ٢ |

---

## إعدادات في لوحة التحكم

البائع يدير API Keys الخاصة به من:
`app.carsell.one/settings/developer`

- إنشاء API Keys (live + test)
- تحديد الـ scopes لكل key
- إدارة Webhooks
- عرض سجل الاستدعاءات (API logs)
- اختبار Webhooks
