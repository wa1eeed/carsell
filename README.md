# CarLink 🚗

**سوق السيارات في السعودية والخليج**  
SaaS platform for car showrooms — bilingual (Arabic primary / English secondary).

**Domain:** carlink.sa | app.carlink.sa | {slug}.carlink.sa

---

## Quick Start

```bash
cd apps/web
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, R2_*, TAP_SECRET_KEY

npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Email: `demo@carlink.sa`
- Password: `password123`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Storage | Cloudflare R2 |
| Auth | NextAuth.js (JWT) |
| Payment | Tap.company |
| Validation | Zod |
| i18n | next-intl (ar + en) |
| Deploy | VPS via Coolify |
| Language | TypeScript strict |

---

## Project Structure

```
carlink/
├── apps/web/                   ← Main Next.js application
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/         ← Login, Register, Onboarding
│   │   │   ├── (dashboard)/    ← app.carlink.sa (protected)
│   │   │   │   ├── admin/      ← Super Admin panel
│   │   │   │   ├── billing/    ← Subscription management
│   │   │   │   ├── inventory/  ← Car management
│   │   │   │   └── sales/      ← Sale registration
│   │   │   ├── (marketing)/    ← Public pages (pricing, etc.)
│   │   │   └── showroom/       ← {slug}.carlink.sa public pages
│   │   └── api/v1/             ← REST API routes
│   ├── components/
│   │   ├── features/           ← Domain components (cars, billing, auth)
│   │   ├── layouts/            ← Sidebar, Topbar, DashboardShell
│   │   └── ui/                 ← Shared UI (Skeleton, Badge, Price)
│   ├── lib/                    ← Utilities (auth, tap, feature-gate, tax)
│   ├── repositories/           ← All DB queries (no Prisma in routes)
│   └── services/               ← Business logic
├── packages/
│   ├── nafath/                 ← Nafath OIDC integration
│   ├── vdm/                    ← VDM/Absher vehicle data
│   ├── mojaz/                  ← Mojaz report integration
│   ├── accidents/              ← Accident history (Najm)
│   └── storage/                ← Multi-provider storage (R2/S3)
├── prisma/schema.prisma        ← Database schema (canonical)
└── docs/                       ← Engineering & business documentation
```

---

## Architecture Rules

1. **Repository Pattern** — No `prisma.*` in API routes. All DB queries in `repositories/`
2. **Multi-Tenant Isolation** — Every query includes `showroomId` from JWT
3. **Storage via `getStorage()`** — Never call R2/S3 directly outside `lib/storage/`
4. **Soft Delete** — `deletedAt = now()`, never hard-delete cars
5. **Timeline Append-Only** — `car_timeline` never modified or deleted
6. **VAT Server-Side** — Never trust frontend for tax calculation
7. **Feature Gating** — `requireFeature(showroomId, feature)` in every protected API

---

## Subscription Plans

| Plan | Monthly | Cars | Market | Auctions | API |
|---|---|---|---|---|---|
| Starter (ستارتر) | 199 SAR | 15 | ❌ | ❌ | ❌ |
| Growth (نمو) ⭐ | 499 SAR | 50 | ✅ | ❌ | ❌ |
| Pro (برو) | 999 SAR | ∞ | ✅ | ✅ | ✅ |
| Enterprise | Custom | ∞ | ✅ | ✅ | ✅ |

All plans include 14-day free trial. Plans and pricing are fully managed by Super Admin.

---

## API Overview

Base URL: `https://app.carlink.sa/api/v1`  
Authentication: `Authorization: Bearer <jwt>`

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Register + optional plan selection |
| `GET /plans` | Public plan list |
| `POST /subscriptions` | Start trial |
| `POST /subscriptions/checkout` | Initiate Tap payment |
| `POST /webhooks/tap` | Tap payment webhook |
| `GET/POST /cars` | List / create cars |
| `POST /cars/:id/publish` | Publish car (fixed/soum/auction) |
| `POST /sales/:carId` | Register sale + VAT calculation |
| `GET/POST /admin/plans` | Admin: manage plans |
| `GET/PUT /admin/settings` | Admin: platform settings + Tap keys |

Full API reference: `docs/developer-portal/api-reference.md`

---

## Environments

| | Dev | Staging | Production |
|---|---|---|---|
| Domain | localhost:3000 | staging.carlink.sa | carlink.sa |
| Branch | feature/* | main | release tag |
| DB | carlink_dev | staging DB | prod DB |
| Tap | test keys | test keys | live keys |

---

## Design System

- **Primary:** Navy `#0F3460`
- **Accent:** Gold `#C9A84C` (all prices)
- **Font:** IBM Plex Sans Arabic
- **Direction:** RTL (Arabic default)
- **Icons:** Lucide React only
- **Border radius:** 12px cards, 8px buttons

---

## Developer Portal

`developers.carlink.sa` — API docs, authentication, sandbox environment.

---

## License

Proprietary — CarLink © 2025
