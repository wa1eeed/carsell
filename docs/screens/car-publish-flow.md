# نشر السيارة للبيع — Publish Flow

---

## نقطة الدخول

زر "نشر للبيع" يظهر على كل سيارة بحالة `DRAFT` أو `IN_STOCK`.
بعد الضغط تظهر modal بثلاثة خيارات.

---

## الخيارات الثلاثة

### ١. سعر مباشر (Fixed Price)
```
car.displayMode = 'FIXED_PRICE'
car.status      = 'FOR_SALE'
car.sellPrice   = المدخل
car.listedOnMarket = true (اختياري — إذا فعّل Market)
```

**الحقول:**
- سعر البيع `*`
- يشمل الضريبة / لا يشمل
- طريقة التواصل (واتساب / اتصال / الاثنين)
- ملاحظة للمشتري

---

### ٢. على السوم (Negotiable)
```
car.displayMode = 'SOUM'
car.status      = 'FOR_SALE'
car.sellPrice   = السعر المبدئي المعروض
car.minAcceptedPrice = السعر الأدنى (سري — لا يظهر للمشتري)
```

**الحقول:**
- سعر العرض المبدئي
- أدنى سعر مقبول (سري)
- ملاحظة

---

### ٣. مزاد (Auction)
```
car.displayMode  = 'AUCTION'
car.status       = 'AUCTION'
car.auctionType  = 'PUBLIC' | 'PRIVATE'
```

**الحقول المشتركة:**
- سعر الافتتاح `*`
- عربون الحجز (اختياري — يُسقَط من المشترين)
- تاريخ البدء `*`
- مدة المزاد: ٢٤ساعة / ٤٨ساعة / ٧٢ساعة / أسبوع
- سعر الشراء الفوري (اختياري — يغلق المزاد فوراً)

#### مزاد عام (Public)
```
car.auctionType = 'PUBLIC'
```
- يظهر في CarLink Market لجميع المستخدمين
- يظهر في واجهة المعرض أيضاً

#### مزاد خاص (Private)
```
car.auctionType    = 'PRIVATE'
car.auctionSlug    = uuid قصير — مثال: xK9mP2
car.auctionUrl     = carlink.sa/auction/private/{slug}
```
- لا يظهر في CarLink Market
- لا يظهر في واجهة المعرض العامة
- البائع يشارك الرابط يدوياً مع عملائه
- من يملك الرابط يستطيع المزايدة

---

## الـ Schema الإضافي

```prisma
// إضافات على Car
model Car {
  displayMode          String?   // FIXED_PRICE | SOUM | AUCTION
  minAcceptedPrice     Decimal?  @db.Decimal(12,2)  // سري
  auctionType          AuctionType?  // PUBLIC | PRIVATE | NONE
  auctionSlug          String?   @unique  // للمزاد الخاص
  auctionStartAt       DateTime?
  auctionEndsAt        DateTime?
  auctionOpeningPrice  Decimal?  @db.Decimal(12,2)
  auctionBuyNowPrice   Decimal?  @db.Decimal(12,2)
  auctionDepositAmount Decimal?  @db.Decimal(10,2)
}

enum AuctionType {
  NONE
  PUBLIC
  PRIVATE
}
```

---

## شاشة التأكيد بعد النشر

| نوع النشر | ما يظهر |
|---|---|
| سعر مباشر | ✅ تم النشر + السعر + "معرض + Market" |
| على السوم | ✅ تم النشر + "قابل للتفاوض" |
| مزاد عام | 🔨 تم إنشاء المزاد + "CarLink Market" + مدة |
| مزاد خاص | 🔒 تم إنشاء المزاد + الرابط الخاص للمشاركة |

---

## CarTimeline — تسجيل الحدث

```typescript
await prisma.carTimeline.create({
  data: {
    carId,
    userId: user.id,
    eventType: 'STATUS_CHANGED',
    payload: {
      from: 'DRAFT',
      to: 'FOR_SALE',
      displayMode: 'FIXED_PRICE' | 'SOUM' | 'AUCTION',
      auctionType: 'PUBLIC' | 'PRIVATE' | null,
    }
  }
})
```
