# TODO — الجلسة القادمة
> ملف عمل سريع. للتفاصيل الكاملة راجع `PROJECT_STATUS.md`.

## 🔴 فوري (الجلسة الحالية)
- [ ] إنهاء النشر على Coolify (Redeploy → `node prisma/seed.mjs`)
- [ ] إضافة رابط دخول الأدمن (الطلب الجديد من المستخدم)
- [ ] بقية ملاحظات المستخدم (سيُذكر تفصيلاً)

## 🟡 الأولوية الأولى (متفق عليه)
- [ ] **i18n للصفحات القديمة** (12 ملف):
  - [ ] `(dashboard)/customers/page.tsx`
  - [ ] `(dashboard)/sales/page.tsx`
  - [ ] `(dashboard)/billing/BillingClient.tsx`
  - [ ] `(dashboard)/reports/page.tsx`
  - [ ] `(dashboard)/settings/SettingsClient.tsx`
  - [ ] `(admin)/admin/page.tsx`
  - [ ] `(admin)/admin/plans/AdminPlansClient.tsx`
  - [ ] `(admin)/admin/showrooms/AdminShowroomsClient.tsx`
  - [ ] `(admin)/admin/kyc/AdminKycClient.tsx`
  - [ ] `(admin)/admin/payments/page.tsx`
  - [ ] `(admin)/admin/settings/AdminSettingsClient.tsx`
  - [ ] `features/dashboard/PublicLinksPanel.tsx`

## 🟢 الأولوية الثانية (الجزء الكبير)
- [ ] **اللاندينق بيج التسويقي** (`carsell.one/`) — يستهدف المعارض
- [ ] **إعادة تصميم الماركت بليس** (`carsell.one/market`):
  - [ ] كاروسيل: جديدة / مستعملة / مزادات
  - [ ] فلاتر كاملة (سعر، سنة، كم، وقود، ناقل، لون، مدينة، حالة)
  - [ ] بحث رئيسي (براند / شكل المركبة)
  - [ ] **تاق "متاح بالتمويل"** على البطاقة (لو المعرض فعّله)

## 🔵 مؤجّل (مسجّل)
- [ ] **المزاد كامل**:
  - [ ] إصلاح الصورة الضبابية
  - [ ] إعدادات المزاد (حد أدنى، عربون)
  - [ ] محفظة العميل (دفع عربون لتفعيل المزايدة)

## 🟣 تشغيلي (لاحقاً)
- [ ] Connection pooling (PgBouncer)
- [ ] Sentry error monitoring
- [ ] E2E tests (Playwright)
- [ ] Automated backups (R2 daily)
- [ ] Developer Portal
- [ ] Notifications (SMS/WhatsApp)

---

## ✅ تم مؤخراً
- ✅ صفحة الطلبات (`/requests`) — حجز/سوم/شراء — ثنائي اللغة كامل
- ✅ حقل جوال دولي
- ✅ الماركت في الهيدر بدل sidebar
- ✅ شيلت النطاق الفرعي من اللوحة
- ✅ سوبر أدمن من env vars
- ✅ i18n لـ SubscriptionBanner + PlanGate
- ✅ كل إصلاحات النشر (Dockerfile, healthcheck, seed.mjs)
