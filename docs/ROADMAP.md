# CarLink — Roadmap & Priorities

Last updated: 2026-06-11

---

## ✅ Completed

- Phase 1: Project setup, i18n, design system, Prisma schema
- Phase 2: Auth (email/password + Nafath), onboarding flow
- Phase 3: Dashboard layout + home (KPIs, auctions, activity feed)
- Phase 4: Cars CRUD (inventory, VDM/Absher, Mojaz, accidents)
- Phase 5: Publish flow (Fixed/SOUM/Auction public+private)
- Phase 6: Sale registration + server-side VAT
- Phase 7: Showroom public pages ({slug}.carlink.sa)
- Phase 8: Health check, skeletons, error boundaries
- **Subscription System** — dynamic plans, Tap.company integration
- **Feature Gating** — plan-based access control in API + UI
- **Super Admin Panel** — plans CRUD, showrooms, platform settings, Tap keys

---

## 🔴 Priority 1 — Critical for Launch

### 1. Notifications System
**Why:** Users have no awareness of important events (trial ending, bid received, sale completed).
- In-app notification bell (real-time via polling or SSE)
- SMS via Unifonic/Msegat for: trial ending, payment due, auction won/lost
- WhatsApp via Twilio/Vonage for sale confirmation
- DB: `Notification` model + mark-as-read
- **Effort:** Medium | **Impact:** Very High

### 2. Developer Portal (developers.carlink.sa)
**Why:** Showrooms need to integrate their systems. Also required for B2B sales.
- Quick Start guide
- API key management (create/revoke from `app.carlink.sa/settings/developer`)
- Interactive API reference (Swagger/Redoc)
- Sandbox environment (auto-reset every 24h)
- Webhook configuration UI
- **Effort:** Medium | **Impact:** High (revenue enabler)

### 3. Reports & Analytics
**Why:** Showroom owners need to understand their business performance.
- Monthly sales summary (revenue, profit, VAT)
- Inventory aging report (cars sitting > 30/60/90 days)
- Top performing models
- Export to Excel/PDF
- Basic tier: last 30 days | Advanced: full history + charts | Full: custom date range
- **Effort:** Medium | **Impact:** High (plan differentiation)

---

## 🟡 Priority 2 — Important for Growth

### 4. CarLink Market (Public Marketplace)
**Why:** Core revenue driver and network effect. Buyers find cars from all showrooms.
- `carlink.sa/market` — public browsable catalog
- Filters: brand, city, price range, year, condition
- Car detail with showroom contact
- Featured listings (paid promotion by showroom)
- SEO optimized (SSG with ISR)
- **Effort:** Large | **Impact:** Very High

### 5. Auction System (Live)
**Why:** Public auctions need real-time bidding, currently it's just a form.
- Real-time bidding with WebSocket or Server-Sent Events
- Countdown timer (live, server-authoritative)
- Deposit capture at bid time via Tap
- Outbid notifications
- Auto-extend if bid in last 5 minutes
- **Effort:** Large | **Impact:** High (Pro plan differentiator)

### 6. Customer Portal (Buyers)
**Why:** Individual buyers have no interface. Currently contact is via WhatsApp only.
- Buyer registration (separate from showroom users)
- Saved cars + wishlist
- Bid history
- Purchase history
- **Effort:** Large | **Impact:** Medium-High

---

## 🟢 Priority 3 — Polish & Operations

### 7. E2E Tests (Playwright)
**Why:** As the system grows, manual testing is risky. Critical paths need coverage.
- Register → plan selection → trial start
- Add car → publish → sale registration
- Tap webhook simulation
- Feature gate enforcement
- **Effort:** Medium | **Impact:** High (risk mitigation)

### 8. Error Monitoring (Sentry)
**Why:** Production errors are invisible currently. Need alerting.
- Sentry integration
- Error grouping + alerting
- Performance monitoring (Core Web Vitals)
- **Effort:** Small | **Impact:** High

### 9. KYC Admin Queue
**Why:** Manual KYC submissions are sitting in DB with no admin UI to review them.
- Admin page: pending KYC queue
- View uploaded docs (R2 presigned read URLs)
- Approve / Reject with reason
- Auto-email notification to user
- **Effort:** Small | **Impact:** High (compliance)

### 10. Subscription Renewal (Auto-charge)
**Why:** Currently subscriptions expire without auto-renewal.
- Cron job: check `currentPeriodEnd` approaching
- Auto-charge using saved `tapCardId`
- Retry on failure (3 attempts over 3 days) → PAST_DUE → email
- **Effort:** Medium | **Impact:** Very High (revenue continuity)

---

## 🔵 Priority 4 — Future / Nice to Have

| Feature | Description |
|---|---|
| Multi-language Catalog | Add English names for all brands/models |
| Showroom Team Management | Invite team members (MANAGER/STAFF roles) |
| Expense Tracking | Operational expenses per showroom |
| WhatsApp Business API | Automated follow-ups, bid notifications |
| Mobile App (React Native) | iOS + Android for showroom staff |
| ZATCA e-invoicing | Official Saudi e-invoice (فاتورة) integration |
| Insurance Integration | Direct insurance quotes from car detail page |
| Financing Integration | Send car to bank financing directly |
| Affiliate Program | Referral tracking + commission for introducers |

---

## Implementation Sequence (Recommended)

```
Now          → Subscription renewal cron + KYC queue + Notifications
Month 1      → Reports + Developer Portal
Month 2      → CarLink Market (public marketplace)
Month 3      → Live Auctions + E2E tests + Sentry
Month 4      → Customer Portal + Mobile App
Month 5+     → ZATCA + Insurance + Financing integrations
```

