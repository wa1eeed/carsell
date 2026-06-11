# CarSell — Design System & UI Standards

> هذا الملف إلزامي قبل بناء أي واجهة.
> يضمن أن كل صفحة في المنصة تبدو كمنتج واحد متماسك.

---

## الهوية البصرية — Brand Identity

### الشخصية
CarSell منصة **احترافية وموثوقة** لسوق السيارات الخليجي.
ليست casual مثل التطبيقات الاجتماعية، وليست جافة مثل برامج المحاسبة.
**المزيج:** ثقة مؤسسية + دفء إنساني + تقنية حديثة.

### المستخدمون
- **المعرض:** يريد أداة احترافية تعكس جدية نشاطه
- **الفرد البائع:** يريد سهولة دون التنازل عن المصداقية
- **المشتري:** يريد ثقة وشفافية قبل القرار

---

## الألوان — Color Palette

```css
:root {
  /* Primary — الأزرق الخليجي الداكن */
  --cl-primary:       #0F3460;   /* Deep Navy — الثقة والاحترافية */
  --cl-primary-hover: #0A2540;
  --cl-primary-light: #E8F0FE;

  /* Accent — الذهبي الخليجي */
  --cl-accent:        #C9A84C;   /* Gold — الفخامة والجودة */
  --cl-accent-hover:  #A8882F;
  --cl-accent-light:  #FBF3DC;

  /* Success */
  --cl-success:       #1B7A4A;
  --cl-success-light: #E6F4ED;

  /* Warning */
  --cl-warning:       #B45309;
  --cl-warning-light: #FEF3C7;

  /* Danger */
  --cl-danger:        #9B1C1C;
  --cl-danger-light:  #FEE2E2;

  /* Neutrals */
  --cl-gray-50:       #F8FAFC;
  --cl-gray-100:      #F1F5F9;
  --cl-gray-200:      #E2E8F0;
  --cl-gray-400:      #94A3B8;
  --cl-gray-600:      #475569;
  --cl-gray-800:      #1E293B;
  --cl-gray-900:      #0F172A;

  /* Backgrounds */
  --cl-bg-page:       #F8FAFC;   /* خلفية الصفحة */
  --cl-bg-card:       #FFFFFF;   /* خلفية الكارد */
  --cl-bg-sidebar:    #0F3460;   /* الـ Sidebar داكن */

  /* Text */
  --cl-text-primary:  #0F172A;
  --cl-text-secondary:#475569;
  --cl-text-muted:    #94A3B8;
  --cl-text-on-dark:  #F8FAFC;
  --cl-text-on-dark-muted: rgba(248,250,252,0.65);
}
```

### قاعدة الاستخدام
```
Navy (#0F3460)  → أزرار أساسية، headers، sidebar، links
Gold  (#C9A84C) → badges مميزة، أسعار، تأكيد صفقة، premium
White/Gray      → خلفيات، بطاقات، مساحات تنفس
```

---

## الطباعة — Typography

```css
/* الخطوط */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=IBM+Plex+Mono&display=swap');

:root {
  --font-primary: 'IBM Plex Sans Arabic', 'Segoe UI', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;  /* أرقام، VIN، لوحات */
}

/* Scale */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 14px;
--text-md:   16px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;
--text-3xl:  36px;
```

**IBM Plex Sans Arabic** — يدعم العربية والإنجليزية بشكل متناسق، يبدو احترافياً في واجهات الأعمال دون جفاف.

---

## المكوّنات — Components

### البطاقة الأساسية (Card)
```css
.cl-card {
  background: var(--cl-bg-card);
  border-radius: 12px;
  border: 1px solid var(--cl-gray-200);
  padding: 16px 20px;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.cl-card:hover {
  border-color: var(--cl-gray-400);
  box-shadow: 0 4px 16px rgba(15, 52, 96, 0.08);
}
```

### بطاقة السيارة (Car Card)
```
┌─────────────────────────────────┐
│  [صورة السيارة 16:10]           │
│  [badge الحالة]                 │
├─────────────────────────────────┤
│  براند + موديل + سنة            │
│  اللون • الكيلومتراج • ناقل    │
│                                 │
│  السعر بالذهبي — 345,000 ر.س   │
│  [زر واتساب]  [تفاصيل ←]       │
└─────────────────────────────────┘
```

### الأزرار
```css
/* Primary */
.btn-primary {
  background: var(--cl-primary);
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
}
.btn-primary:hover { background: var(--cl-primary-hover); }

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--cl-primary);
  border: 1.5px solid var(--cl-primary);
  border-radius: 8px;
}

/* Gold / Premium */
.btn-gold {
  background: var(--cl-accent);
  color: white;
}

/* Danger */
.btn-danger {
  background: var(--cl-danger);
  color: white;
}
```

### badges الحالة
```css
/* نظام ثابت لحالات السيارة */
.badge-available { background: #E6F4ED; color: #1B7A4A; }  /* متاحة */
.badge-reserved  { background: #FEF3C7; color: #B45309; }  /* محجوزة */
.badge-sold      { background: #F1F5F9; color: #475569; }  /* مباعة */
.badge-auction   { background: #EEF2FF; color: #3730A3; }  /* مزاد */
.badge-new       { background: #E8F0FE; color: #0F3460; }  /* جديدة */
```

### الـ Sidebar
```
خلفية: Navy (#0F3460)
نص عادي: rgba(255,255,255,0.65)
نص active: white
item active: background rgba(255,255,255,0.1) + border-right 3px solid Gold
icons: Lucide React — 18px
```

### الجداول (Tables)
```css
.cl-table th {
  background: var(--cl-gray-50);
  font-size: 12px;
  font-weight: 500;
  color: var(--cl-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 14px;
  border-bottom: 1px solid var(--cl-gray-200);
}
.cl-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--cl-gray-100);
  font-size: 13px;
  color: var(--cl-text-primary);
}
.cl-table tr:hover td { background: var(--cl-gray-50); }
```

### الفورم (Forms)
```css
.cl-input {
  border: 1.5px solid var(--cl-gray-200);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--font-primary);
  transition: border-color 0.15s;
}
.cl-input:focus {
  border-color: var(--cl-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(15, 52, 96, 0.08);
}
.cl-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--cl-text-secondary);
  margin-bottom: 5px;
}
```

### الأرقام والأسعار
```css
/* السعر دائماً بالذهبي وخط mono */
.cl-price {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--cl-accent);
}
.cl-price-small {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--cl-accent);
}
/* VIN ورقم اللوحة */
.cl-vin, .cl-plate-number {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.05em;
}
```

---

## التخطيط — Layout

### Dashboard Layout
```
┌──────────────┬────────────────────────────────────┐
│              │  Topbar                             │
│   Sidebar    ├────────────────────────────────────┤
│   (Navy)     │                                    │
│   240px      │   Main Content Area                │
│              │   padding: 24px                    │
│              │   background: #F8FAFC              │
└──────────────┴────────────────────────────────────┘
```

### Showroom Public Page Layout
```
┌────────────────────────────────────────────────────┐
│  Header: شعار المعرض + معلومات التواصل            │
├────────────────────────────────────────────────────┤
│  Filters Bar: براند | موديل | سعر | سنة           │
├──────────────────┬─────────────────────────────────┤
│  Filters Panel   │   Cars Grid (3 cols)            │
│  (Sticky)        │   Car Card × N                 │
│  256px           │                                │
└──────────────────┴─────────────────────────────────┘
```

### Grid System
```css
/* Car Grid */
.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
```

---

## RTL — الاتجاه العربي

```css
/* على كل صفحة */
html { direction: rtl; }
body { font-family: var(--font-primary); }

/* استثناءات LTR — دائماً */
.vin, .plate-number, .price-number, .phone-number {
  direction: ltr;
  text-align: left;
  font-family: var(--font-mono);
}
```

---

## الأيقونات — Icons

```
المكتبة: Lucide React (حصراً)
الحجم: 16px inline، 20px في الأزرار، 22px في الـ sidebar

أيقونات السيارة:
  car          → السيارة
  gauge        → الكيلومتراج
  fuel         → الوقود
  settings-2   → ناقل الحركة
  calendar     → السنة
  palette      → اللون
  hash         → رقم الهيكل (VIN)

أيقونات الحالة:
  check-circle → متاح / مكتمل
  clock        → معلق / انتظار
  x-circle     → مرفوض
  shield-check → موثّق / نفاذ
  alert-circle → تحذير

أيقونات العمليات:
  plus         → إضافة
  pencil       → تعديل
  trash-2      → حذف
  upload       → رفع
  download     → تحميل
  search       → بحث
  filter       → فلتر
  phone        → اتصال
  message-circle → واتساب/تواصل
```

---

## لوحة السيارة السعودية

```tsx
// مكوّن ثابت — لا تعدّله
// اللوحة: أبيض | ثلاثة أقسام: حروف عربية | KSA | أرقام
// الخط: font-mono، حجم يناسب الـ context
// الألوان حسب النوع:
//   PRIVATE   → border #1E293B, bg white
//   TAXI      → bg #FCD34D, border #92400E
//   TRANSPORT → bg #1E3A5F, color white
```

---

## Micro-interactions

```css
/* Hover على الكارد */
.cl-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
.cl-card:hover { transform: translateY(-2px); }

/* Badge pulse للحالة المتاحة */
.badge-available::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #1B7A4A;
  margin-left: 6px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Loading skeleton */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## قواعد لا تُكسر (Claude Code — اقرأها أولاً)

```
1. الـ Sidebar دائماً Navy (#0F3460) — لا أبيض، لا رمادي
2. الأسعار دائماً بالذهبي (#C9A84C) + font-mono
3. VIN ورقم اللوحة دائماً LTR + font-mono
4. كل badge حالة له لون محدد — لا تخترع ألواناً جديدة
5. الأيقونات Lucide فقط — لا FontAwesome، لا Material
6. direction: rtl على كل صفحة
7. الخط IBM Plex Sans Arabic — لا Inter، لا Roboto
8. border-radius: 12px للكروت، 8px للأزرار والـ inputs
9. لا gradients في الخلفيات الرئيسية — ألوان flat
10. hover على الكروت: translateY(-2px) + shadow خفيف
```

---

## مثال عملي — Car Card

```tsx
// هذا هو المعيار — كل كارد سيارة يتبع هذا النمط
<div className="cl-card car-card">
  {/* صورة */}
  <div className="car-image-wrap">
    <img src={car.coverImageUrl} alt={car.title} />
    <span className={`badge badge-${car.status}`}>{statusLabel}</span>
  </div>

  {/* بيانات */}
  <div className="car-info">
    <h3>{car.brand} {car.category} {car.year}</h3>
    <div className="car-specs">
      <span><Gauge size={14}/> {car.odometer.toLocaleString()} كم</span>
      <span><Fuel size={14}/> {car.fuelType}</span>
      <span><Settings2 size={14}/> {car.transmission}</span>
    </div>
  </div>

  {/* السعر والأكشن */}
  <div className="car-footer">
    <span className="cl-price">
      {car.sellPrice.toLocaleString('ar-SA')} ر.س
    </span>
    <div className="car-actions">
      <button className="btn-whatsapp"><MessageCircle size={16}/></button>
      <button className="btn-primary">تفاصيل</button>
    </div>
  </div>
</div>
```

---

## تعليمات لـ Claude Code

عند بناء أي صفحة في CarSell:

1. **استورد الخطوط** من Google Fonts: IBM Plex Sans Arabic
2. **طبّق المتغيرات** من قسم الألوان أعلاه
3. **الـ Sidebar** دائماً Navy مع نص أبيض
4. **الأسعار والأرقام** دائماً Mono + Gold
5. **الاتجاه** RTL على كل شيء ما عدا الاستثناءات المذكورة
6. **الأيقونات** Lucide React حصراً
7. **لا تبتكر ألواناً جديدة** — استخدم المتغيرات فقط
8. **كل صفحة جديدة** تسأل: هل تتطابق مع هذا الملف؟

المرجع البصري: [هذا الملف] `docs/design/design-system.md`
