# Changelog

All notable changes to CarSell are documented here.  
Format: [Semantic Versioning](https://semver.org) | [Keep a Changelog](https://keepachangelog.com)

---

## [1.0.6] — 2026-06-13 · SOLD Cars on Public Page + Plate Redesign

### Fixed
- **السيارات المباعة (SOLD) على صفحة المعرض العامة** — كانت `showroomPublicRepository.findCar` تستثني حالة `SOLD`، فالرابط `/{slug}/cars/{id}` لسيارة مباعة يرجع `notFound` ويظهر خطأ. الآن السيارة المباعة تظهر بشكل طبيعي مع شارة **SOLD** قطرية كبيرة فوق صورتها

### Changed
- **تصميم لوحة السيارة (`SaudiPlate`)** — استُبدل رمز العلم بشعار **النخلة والسيفين** (SVG)، والخط أصبح **Arial Bold** لكل الحروف والأرقام، وكل حرف/رقم في عمود مستقل بحيث يكون العربي فوق الإنجليزي بمحاذاة تامة

---

## [1.0.5] — 2026-06-13 · Showroom-relevant Dashboard KPIs

### Changed
- **عدّادات لوحة المعرض (KPIs)** — أُعيد بناؤها لتعرض ما يهم صاحب المعرض فعلاً. العدّادات الأربعة الآن: **المخزون / مبيعات الشهر / الإيرادات / الطلبات المعلّقة**
- **استبدال «المستخدمون النشطون»** بعدّاد **الطلبات المعلّقة** (`pendingRequests`) — وهو الأهم تشغيلياً للمعرض إذ يُظهر فوراً الطلبات التي تنتظر رداً

### Added
- **`pendingRequests` في `DashboardKpis`** — يحسب `carRequest.count` بحالة `PENDING` ضمن نطاق `showroomId` (وكامل المنصّة لمشرف المنصّة)، مع `.catch(() => 0)` للمتانة
- **أيقونة `requests` (Inbox) بلون برتقالي** في `KpiCard`
- **مفاتيح ترجمة `pendingRequests`** في `ar.json` و`en.json`

---

## [1.0.4] — 2026-06-13 · Session Separation + Admin-only KPI

### Fixed
- **خطأ عند تحديث لوحة المعرض أثناء تسجيل الدخول كمشرف** — المتصفح يشارك كوكي الجلسة بين كل التبويبات، فإذا سجّلت دخول لوحة الأدمن في تبويب ثم حدّثت تبويب المعرض المفتوح، كانت لوحة المعرض تعمل بجلسة أدمن وتنهار صفحاتها الداخلية. الآن `(dashboard)/layout.tsx` يحوّل أي جلسة `PLATFORM_ADMIN` إلى `/admin` (انعكاس لما تفعله لوحة الأدمن مع مستخدمي المعارض)، فالفصل بين اللوحتين نظيف ولا تظهر صفحة خطأ

### Changed
- **مؤشر Showrooms في لوحة المعرض** — أُزيل من لوحة المعرض لأنه نطاق مشرف المنصّة فقط (يحسب عدد كل المعارض) ولا معنى له لمستخدم المعرض. شبكة الـ KPI أصبحت 4 أعمدة بدلاً من 5

---

## [1.0.3] — 2026-06-13 · carPublicId Lookup + Robust Showroom URL

### Fixed
- **صفحة تفاصيل السيارة في لوحة المعرض** (`/inventory/CS26000014`) — كانت تنهار (client-side exception / 404) لأن الصفحة كانت تتعامل مع `carPublicId` كأنه UUID. الآن `inventory/[id]` و`inventory/[id]/print` يكتشفان نمط `CS\d{8}` ويبحثان عبر `carRepository.findByPublicId`
- **`carRepository.findByPublicId`** — دالة جديدة للبحث عن السيارة بـ `carPublicId` ضمن نطاق المعرض
- **زر My Showroom** — أصبح طلب `customDomain` منفصلاً في الـ layout، بحيث لا يؤدي غياب العمود في قواعد بيانات قديمة إلى تصفير الـ slug وإخفاء/تعطيل الزر. كما يتم تجاهل slug الخاص بـ `__platform__`. الرابط الآن دائماً `carsell.one/{slug}` أو الدومين الخاص الموثّق

---

## [1.0.2] — 2026-06-13 · Inventory Links + Print Slip Fix

### Fixed
- **روابط Inventory** — كانت الروابط تستخدم `carRefNumber` (مثل `/inventory/14`) والآن تستخدم `carPublicId` (مثل `/inventory/CS26000014`) في كل من: بطاقة السيارة (CarCard)، قائمة العرض (InventoryView list view)
- **`CarCardData` interface** — أُضيف حقل `carPublicId?: string | null` وتم تمريره من `inventory/page.tsx`
- **ورقة السيارة (Print Slip)** — حُذف `target="_blank"` فأصبحت تفتح في نفس التاب، وزر الباك يعمل بشكل صحيح. الرابط أصبح يحمل `carPublicId` بدلاً من `carRefNumber`

---

## [1.0.1] — 2026-06-13 · URL Prefix Fix + Resilient Car Detail

### Fixed
- **Showroom car links** — روابط السيارات في صفحة المعرض كانت تُضاف `/ar/` قبل الرابط رغم أن العربية (اللغة الافتراضية) لا تحتاج locale prefix مع إعداد `as-needed`. الروابط الآن نظيفة: `/al-fahad/cars/CS26000001` بدلاً من `/ar/al-fahad/cars/CS26000001`
- **Showroom car detail page** (`/{slug}/cars/{id}`) — أُضيف `.catch(() => null)` على استدعاء `findCar` في كل من الـ page وفي `generateMetadata`، بحيث إذا حدث خطأ في DB (مثلاً migration لم تُنفَّذ بعد في production) تظهر صفحة 404 بدلاً من error 500

---

## [1.0.0] — 2026-06-13 · Car Public ID + URL Routing + UX Polish

### Added
- **Car Public ID (`carPublicId`)** — platform-wide unique human-readable ID for every car:
  - Format: `CS` + 2-digit year + 6-digit sequence = 10 chars (e.g. `CS26000001`)
  - Resets counter per year (`CS27000001` starts in 2027)
  - Auto-generated on car creation; backfilled for existing cars via migration
  - Displayed as gold badge in CarDetail (dashboard), PublicCarDetail (showroom), MarketCarDetailClient (market)
  - `carPublicId` field on Car model with `UNIQUE` constraint and index
  - Migration `20260613_car_public_id`: adds column + backfills ordered by `createdAt`

### Changed
- **All car URLs** now use `carPublicId` instead of UUID or carRefNumber:
  - Market: `/market/cars/CS26000001`
  - Showroom pretty URL: `/al-fahad/cars/CS26000001`
  - Showroom custom domain: `showroom.com/cars/CS26000001`
  - ShareButton, print slip QR, print slip back link — all updated
- **Showroom car links** — `basePath` fixed to generate pretty-URL links (`/{locale}/{slug}/cars/{id}`) instead of internal `/showroom/cars/{uuid}`
- **`getMarketCar`** + **`showroomPublicRepository.findCar`** — accept carPublicId (`CS\d{8}` pattern), carRefNumber (numeric), or UUID for backwards compat
- **My Showroom button** (Topbar):
  - URL now `carsell.one/{slug}` (was `{slug}.carsell.one`)
  - Uses verified custom domain if showroom has one (`customDomain` + `customDomainVerified`)
  - Layout fetches `customDomain` + `customDomainVerified` and computes `showroomUrl` server-side
- **Print slip back button** — replaced `router.back()` with direct `<a href={backUrl}>` (print opens in new tab — no history to go back to); `backUrl` passed as prop from server page
- **Print slip QR URL** — uses `carsell.one/{slug}/cars/{carPublicId}` (was `{slug}.carsell.one`)
- **CarDetail** — added back button "رجوع إلى المخزون" at top of page
- **Requests tabs (RESERVED, WAITING_PAYMENT, OWNERSHIP_TRANSFER)** — wrapped in `.catch()` to prevent server crash if DB migration hasn't applied new enum values yet
- **Market nav ("كل السيارات", "مزادات")** — "All Cars" links to `?page=1` (shows catalog list), "Auctions" links to `?displayMode=AUCTION` (new filter)
- **`listMarketCars`** — new `displayMode?: 'AUCTION'` filter (sets `status = 'AUCTION'` in where clause)

### DB Migrations
- `20260613_car_public_id` — adds `car_public_id TEXT UNIQUE` + backfill using `ROW_NUMBER()` per year

---

## [0.9.0] — 2026-06-13 · Market Redesign + UX Fixes + Brand Logos

### Added
- **Market Homepage** (`MarketHome.tsx`) — professional marketplace landing:
  - Sticky nav bar with sections (New / Used / Auctions / All)
  - Hero section with quick-filter pills and CTA
  - Brand logos carousel — click to filter by brand
  - Body type filter bar (SUV, Sedan, Pickup, Coupe, Hatchback, Van, Convertible, Wagon)
  - Sections: Live Auctions (with countdown timer), New Cars, Used Cars
  - Market homepage shown when no filters active; existing search UI shown otherwise
- **Brand Logo Upload** (`AdminCatalogClient.tsx`) — `LogoUploader` component:
  - Upload brand logo directly from device → Cloudflare R2 via presign API
  - Stored under `brand-logos/` prefix in R2
  - Preview shown immediately after upload
- **Dashboard Topbar** — two new buttons:
  - "My Showroom" → opens `slug.carsell.one` in new tab (shown when slug exists)
  - "CarSell Market" → opens public marketplace in new tab
- **`getMarketHomepageData()`** in `market.repository.ts` — fetches new/used/auction/brands in parallel

### Fixed
- **Print slip back button** — replaced `javascript:history.back()` with `router.back()`
- **Print slip QR URL** — now points to showroom landing page (`slug.carsell.one/cars/ref`) instead of market
- **Share button** (`ShareButton.tsx`) — dashboard source now links to showroom page when slug available
- **Requests tabs** — replaced hardcoded `/${locale}/requests` URL with `pathname`-relative navigation (was opening wrong page)
- **CarDetail share** — passes `showroomSlug` and `carRefNumber` to ShareButton

---

## [0.8.0] — 2026-06-13 · Car Detail Overhaul + Pipeline + Bid Increment

### Added
- **Car Detail Page** — complete redesign (`CarDetail.tsx`):
  - Tabs: Details, Financial, Bids (auction only), Soum Offers, Timeline, Documents, Accidents, Mojaz
  - Hero header with cover image, status badge, car ref number
  - Smart publish/unpublish toggle (shows "Stop Listing" with confirmation when live)
  - BidsTab: ranked list with winning badge + auction stats grid
  - SaumTab: negotiation history with accepted offer highlighted
  - TimelineTab: vertical timeline with Lucide icons and human-readable labels
- **Car Request Pipeline** — stages: `PENDING → RESERVED → WAITING_PAYMENT → OWNERSHIP_TRANSFER → COMPLETED` (+ REJECTED/CANCELLED)
  - Auto-syncs `Car.status` when request status changes (in single `$transaction`)
  - Creates `Customer` record automatically when request reaches RESERVED
  - Pipeline progress bar in RequestsClient with per-stage counters
- **Unpublish endpoint** — `POST /api/v1/cars/[id]/unpublish` reverts car to DRAFT with timeline entry
- **Bid Increment field** — `auctionBidIncrement` on Car model; added to PublishModal and publish service
- **carRefNumber URLs** — `/inventory/10001` and `/market/cars/10001` work alongside UUID
- **carRefNumber badge** on inventory cards + list view links updated
- **Search in inventory** — single search box supports: ref number (numeric), VIN, plate, brand name
- **Bilingual print slip** — switches AR/EN based on locale; shows carRefNumber badge
- **Dashboard KPIs** — month-over-month trend % (↑↓) for sales and revenue
- **Dashboard alerts** — pending requests (24h+), active deals count, cars without images

### DB Migrations
- `20260613_request_stages_customer_link` — new CarRequestStatus enum values + `customerId` FK
- `20260613_auction_bid_increment` — `auctionBidIncrement` column on `cars` table

---

## [0.7.0] — 2026-06-11 · Deployment + Requests + i18n start

### Added
- **Car Requests feature** — buyer submits reservation / SOUM offer / purchase
  request on a car. Dealer inbox at `/requests` with tabs (pending/accepted/
  completed/rejected), accept/reject, buyer contact. **Fully bilingual** ✅
- **International phone input** — country dial-code dropdown (50+ countries,
  Gulf/Arab first, default SA) + national number field → emits E.164
- **Super Admin from env** — created/updated by seed when SUPER_ADMIN_EMAIL +
  SUPER_ADMIN_PASSWORD are set (production-safe, no hardcoded credentials)
- **Reserved slugs guard** + reserved-word handling at slug update
- **CarSell Live link in header** — opens public marketplace in new tab
  (moved out of dashboard sidebar)
- **i18n started** for feature components (SubscriptionBanner, PlanGate)
- **Docker deployment**:
  - Root-level Dockerfile (Coolify auto-detects)
  - Auto-migrations on startup via entrypoint
  - **Plain JS seed** (`prisma/seed.mjs`) — runs with `node`, no tsx/compile
  - Optional `SEED_ON_START=true` for fully automated seed at deploy
  - Healthcheck uses IPv4 (`127.0.0.1`) with 90s start period
  - Build resilient to `NODE_ENV=production` injection (forces devDependencies)
- **Robustness First** principle enshrined in `CLAUDE.md` (governing rule)
- **Database performance indexes** on hot query paths (cars, sales, customers,
  car_images, car_timeline, car_documents) — 11 indexes total
- **DB schema**: `CarRequest` model + status/type enums + indexes

### Changed
- **Rebrand**: CarLink → CarSell · `carlink.sa → carsell.one` (68 files)
- **Phone validation**: legacy Saudi-only regex → robust E.164 (`+966...`)
- **Onboarding**: pre-fills phone+city from user record (no re-entry)
- **Settings**: removed subdomain display (`{slug}.carsell.one`) — keep
  `carsell.one/{slug}` only
- **Sidebar**: replaced `/market` with `/requests` (Inbox icon)
- **Market detail "view showroom" link** → `/{slug}` (was `/showroom`)
- **HTTP status codes**: reserved slug → 400, taken → 409 (were 500)
- **API error messages**: friendly first issue text instead of raw Zod JSON

### Fixed
- **Hydration mismatch** from `window.location.origin` (added `useOrigin()` hook)
- Plans page in register flow failing to load (try/catch + auto-select featured)
- Dockerfile Coolify discovery (moved to repo root)
- Healthcheck IPv6 vs IPv4 binding issue
- Production seed module not found (compile vs plain JS approach)

### Database Migrations
- `20260611_performance_indexes` — 11 indexes on cars/sales/customers/...
- `20260611_car_requests` — CarRequest model + indexes

### Known Issue
- **In-progress deployment**: Current container built from older Dockerfile
  (without seed.cjs/mjs). Resolution requires redeploy in Coolify, then
  `node prisma/seed.mjs` from the carsell app terminal.

---

## [0.6.0] — 2026-06-11 · Complete Pages + Verification

### Added
- **Sales page** (`/sales`) — full sales history with stats (count, total, profit) + table
- **Customers page** (`/customers`) — customer cards with purchase count + total spent
- **Reports page** (`/reports`) — monthly metrics, top-brands chart, inventory breakdown,
  aging-cars alert (>60 days), year summary
- **Admin KYC queue** (`/admin/kyc`) — PENDING/APPROVED/REJECTED tabs, approve/reject,
  document links, Nafath badge
- **Admin Payments** (`/admin/payments`) — Tap payment history + revenue stats
- `repositories/kyc.repository.ts` + `PATCH /api/v1/admin/kyc/[id]`

### Fixed
- **Hydration mismatch** — `window.location.origin` differed between SSR (carsell.one)
  and client (localhost). Added `useOrigin()` hook (lib/hooks/use-origin.ts)
- **HTTP status codes** — client errors now 400/409 instead of 500
  (reserved slug → 400, taken slug/domain → 409, DNS-not-found → 400)
- `apiResponse`: added `badRequest` (400) + `conflict` (409) helpers

### Verified
- Full route sweep: 12/12 pages return 200 clean, zero TypeScript errors
- Feature gates enforce 403 (auction blocked on Growth plan)
- Admin guard redirects non-admins to /dashboard
- Multi-tenant isolation confirmed via showroomId scoping

---

## [0.5.0] — 2026-06-11 · Pretty URLs + Custom Domains

### Added
- **Pretty root URLs** — `carsell.one/{slug}` resolves to showroom storefront
  - Reserved-words guard distinguishes slugs from platform routes
  - middleware rewrites via intl middleware (handles as-needed locale prefix)
- **Custom domain** — dealers connect their own domain (e.g. mydealership.com)
  - schema: `customDomain`, `customDomainVerified`, `customDomainToken` on Showroom
  - middleware resolves non-platform hostnames by custom domain
  - `POST /api/v1/showroom/domain` returns A/CNAME/TXT DNS records
  - `POST /api/v1/showroom/domain/verify` checks DNS TXT (Node dns resolver)
- **Settings page** (`/settings`) — slug editor + custom-domain connection with DNS guide

---

## [0.4.0] — 2026-06-11 · Marketplace + Sharing + Security

### Added
- **CarSell Live** (`/market`) — public marketplace across all showrooms with filters
- **Showroom landing pages** + car detail with gallery + WhatsApp CTA
- **Share button** — native Web Share + WhatsApp + copy-link from dashboard/showroom/market
- **Print slip + QR** (`/inventory/[id]/print`) — A4 + label formats for physical showroom
- **Separate Super Admin** (`admin.carsell.one`) — distinct layout from showroom dashboard
- **Multi-tenant ID hardening** — `showroomNumber` (CL-1001) + `carRefNumber` (#47 per tenant)
- **Security** — CSP/HSTS headers, rate limiting, addImages/addDocument ownership checks,
  JWT re-validation every 5min
- **R2 media auto-cleanup** — `media/` (photos/videos) deleted N days after sale,
  `docs/` (invoices) kept forever; admin-configurable; cron endpoint

---

## [0.3.0] — 2026-06-11 · Subscription & Billing

### Added
- **Dynamic Plans** — `Plan` model replacing static enum; fully managed by Super Admin
- **Subscription System** — `Subscription` model with TRIAL → ACTIVE → PAST_DUE lifecycle
- **Tap.company Integration** — Full payment gateway integration
  - `lib/tap/tap.client.ts` — HTTP client reading keys from DB
  - `lib/tap/tap.service.ts` — createCustomer, createCharge, chargeSubscription
  - `POST /api/v1/webhooks/tap` — handles charge.captured / charge.failed
  - `GET /api/v1/billing/callback` — post-payment redirect handler
- **Subscription Service** — startTrial, initiateCheckout, handleWebhook, cancel, changePlan
- **Feature Gating** — `lib/feature-gate.ts` with canUseFeature, requireFeature, canAddCar
- **PlanGate Component** — UI wrapper showing upgrade prompt for locked features
- **SubscriptionBanner** — auto-shown in dashboard for trial expiry / past due / cancelled
- **Register Flow Step 3** — plan selection with monthly/yearly toggle during registration
- **Billing Page** — `/billing` dashboard page for subscription management
- **Super Admin Panel**
  - `/admin/plans` — full CRUD for plans (features, pricing, limits)
  - `/admin/showrooms` — all showrooms + subscription status + override controls
  - `/admin/settings` — Tap API keys (masked), platform info, env toggle (test/live)
- **Platform Settings** — `PlatformSetting` key-value table; keys editable from admin UI
- **API Routes** — `/api/v1/plans`, `/subscriptions`, `/subscriptions/checkout`, `/admin/*`
- **Car Limit Gate** — blocks car creation when showroom exceeds plan's `maxCars`
- **Publish Gate** — blocks auction publish if plan doesn't include AUCTIONS feature
- **Market Gate** — blocks market listing if plan doesn't include MARKET feature
- **Default Plans Seed** — Starter (199), Growth (499)⭐, Pro (999), Enterprise

### Changed
- `Showroom` model — removed static `subscriptionPlan`/`subscriptionStatus` fields
- `auth.service.ts` — now calls `startTrial()` if `planId` provided during register
- `registerSchema` — added `planId` + `billingPeriod` optional fields
- Dashboard layout — fetches subscription and shows `SubscriptionBanner`
- Sidebar — shows Super Admin section for `PLATFORM_ADMIN` role users
- Market + Auctions pages — wrapped with `PlanGate`
- `package.json` — added `prisma.seed` script using `npx tsx`

### Database Migration
- `20260611_plans_subscriptions_tap` — creates `plans`, `subscriptions`, `tap_payments`, `platform_settings` tables

---

## [0.2.0] — 2026-06-10 · Publish Flow + Sales + Showroom

### Added
- **Publish Flow** — `PublishModal` with Fixed Price / SOUM / Auction (Public + Private)
- **Private Auction** — generates unique `auctionSlug`, shareable link
- **Sale Registration** — buyer info, payment methods (Cash/Financing/TradeIn/Mixed)
- **VAT Calculation** — server-side: `USED_QUALIFIED` margin method, others full price
- **Showroom Public Page** — `{slug}.carsell.one` with SSR, filters, SEO metadata
- **Car Detail Public Page** — gallery, specs, Saudi plate, VIN (LTR), contact buttons
- **CarTimeline** — all status changes and actions recorded (append-only)
- **API `/api/v1/cars/:id/publish`** — validates and publishes car
- **API `/api/v1/sales/:carId`** — creates sale with tax breakdown
- **Health Check** — `/api/health` verifying DB + Storage connectivity
- **Loading skeletons** — shimmer animations on all data pages
- **Error boundaries** — per route segment

### Changed
- `car.displayMode` expanded to include `SOUM`
- Inventory car detail — added Publish button triggering modal
- Dashboard — Active Auctions table with countdown timers

---

## [0.1.0] — 2026-06-09 · Foundation + Auth + Dashboard + Inventory

### Added
- **Project Setup** — Next.js 14, TypeScript strict, Tailwind CSS, Prisma
- **Design System** — Navy/Gold palette, IBM Plex Sans Arabic, RTL/LTR support
- **i18n** — next-intl with `ar` (default) + `en`, all strings in `messages/*.json`
- **CSS Variables** — all `--cl-*` design tokens in `globals.css`
- **Domain Routing** — middleware for app.carsell.one / {slug}.carsell.one / carsell.one
- **Database Schema** — 20+ models: Showroom, Car, Sale, Subscription, Bid, etc.
- **Auth System** — NextAuth JWT (15min access, 7d refresh)
- **Login Page** — email/password + Nafath button
- **Register Page** — 2-step (account type + details) with Nafath pre-fill
- **Onboarding** — 4-step progress (Personal Info → KYC → Showroom → First Car)
- **Nafath Integration** — OIDC flow: session → redirect → callback → JWT
- **Dashboard Layout** — Navy sidebar, topbar with locale switcher
- **Dashboard Home** — 5 KPIs, Market section, Active Auctions, Recent Cars, Alerts, Activity Feed
- **Inventory List** — Grid/list toggle, filters, pagination, status badges
- **Add Car Form** — Manual + VDM/Absher pull with diff view confirmation
- **Car Detail** — Tabs: Details | Financial | Timeline | Documents | Accidents | Mojaz
- **VDM Integration** — vehicle data from Absher API
- **Mojaz Integration** — vehicle history report PDF
- **Accidents Check** — Najm/Basher integration
- **Saudi Plate Component** — accurate visual representation
- **Storage Layer** — multi-provider (R2/S3/OSS) via `getStorage()` factory
- **Repository Pattern** — all DB queries in `repositories/`, no Prisma in routes
- **Validation** — Zod schemas on all API inputs
- **Logger** — pino structured logging, no console.log
- **Feature constants** — `lib/constants.ts`, no magic numbers

---

## Upcoming — see `docs/ROADMAP.md`
