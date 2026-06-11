# Architecture Decisions

## ADR-001: Dynamic Plans (not static enum)
**Date:** 2026-06-11  
**Status:** Implemented  
**Decision:** Plans are stored in DB (`plans` table) not as TypeScript enum  
**Reason:** Business needs to change plan limits/prices without code deployment  
**Tradeoff:** Slightly more complex queries, but fully admin-controlled

## ADR-002: Tap.company keys in DB (not env-only)
**Date:** 2026-06-11  
**Status:** Implemented  
**Decision:** `tap_secret_key` stored in `platform_settings` table (encrypted in transit)  
**Reason:** Admin can switch test↔live without server restart or code change  
**Tradeoff:** DB round-trip on every payment call (cached at app level in future)

## ADR-003: Feature Gating at two layers
**Date:** 2026-06-11  
**Status:** Implemented  
**Decision:** Gate both in API (`requireFeature`) AND in UI (`PlanGate`)  
**Reason:** API-only = bad UX (silent failures). UI-only = security risk  
**Tradeoff:** More code, but correct behavior

## ADR-004: Subscription trial starts at registration
**Date:** 2026-06-11  
**Status:** Implemented  
**Decision:** `startTrial()` called inside `registerUser()` if planId provided  
**Reason:** Seamless UX — user gets immediate access without extra step  
**Tradeoff:** Registration can partially fail if Tap customer creation fails (handled gracefully)

## ADR-005: Repository Pattern (no Prisma in routes)
**Date:** 2026-06-09  
**Status:** Implemented  
**Decision:** All DB access via `repositories/` directory  
**Reason:** Testability, tenant isolation enforcement, easier to audit

## ADR-006: Multi-tenant via showroomId in JWT
**Date:** 2026-06-09  
**Status:** Implemented  
**Decision:** Every API call includes `showroomId` from JWT, not from request body  
**Reason:** Prevents horizontal privilege escalation between tenants

## ADR-007: Soft-delete cars
**Date:** 2026-06-09  
**Status:** Implemented  
**Decision:** Set `deletedAt`, never `DELETE FROM cars`  
**Reason:** Audit trail, timeline integrity, potential data recovery

## ADR-008: Server-side VAT always
**Date:** 2026-06-09  
**Status:** Implemented  
**Decision:** Tax calculated in `services/tax.service.ts`, never client  
**Reason:** ZATCA compliance, frontend can be manipulated

