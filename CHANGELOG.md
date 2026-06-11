# Changelog

All notable changes to CarSell are documented here.  
Format: [Semantic Versioning](https://semver.org) | [Keep a Changelog](https://keepachangelog.com)

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
