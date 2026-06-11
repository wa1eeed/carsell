# CarSell API Endpoints Reference

**Base URL:** `https://app.carsell.one/api/v1`
**Auth:** `Authorization: Bearer <jwt_token>`

---

## Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register + optional plan selection |
| POST | `/auth/nafath/session` | Start Nafath OIDC |
| POST | `/auth/nafath/callback` | Nafath callback |
| POST | `/auth/mfa/init` | Start MFA |
| POST | `/auth/mfa/status` | Check MFA status |

## Plans (Public)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/plans` | List public plans |

## Subscriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions` | ✅ | Get current subscription |
| POST | `/subscriptions` | ✅ | Start trial |
| POST | `/subscriptions/checkout` | ✅ | Initiate Tap payment |

## Billing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/billing/callback` | Post-payment redirect from Tap |

## Cars
| Method | Endpoint | Auth | Plan Gate | Description |
|---|---|---|---|---|
| GET | `/cars` | ✅ | — | List showroom cars |
| POST | `/cars` | ✅ | maxCars | Create car |
| GET | `/cars/:id` | ✅ | — | Car details |
| PATCH | `/cars/:id` | ✅ | — | Update car |
| DELETE | `/cars/:id` | ✅ | — | Soft delete |
| POST | `/cars/:id/publish` | ✅ | AUCTIONS / MARKET | Publish car |
| POST | `/cars/:id/vdm-sync` | ✅ | — | Sync from Absher |
| GET | `/cars/:id/accidents` | ✅ | — | Accident history |
| GET | `/cars/:id/mojaz` | ✅ | — | Mojaz report |
| GET | `/cars/:id/documents` | ✅ | — | List documents |
| POST | `/cars/vdm-lookup` | ✅ | — | VIN/sequence lookup |

## Sales
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/sales/:carId` | ✅ | Register sale + VAT |

## Catalog
| Method | Endpoint | Description |
|---|---|---|
| GET | `/catalog/brands` | Brands + categories + models |

## Uploads
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/uploads/presign` | ✅ | Get R2 presigned upload URL |

## Profile
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/profile/personal-info` | ✅ | Update personal info |
| PUT | `/profile/identity` | ✅ | Submit KYC |
| PUT | `/profile/showroom-info` | ✅ | Update showroom |

## Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/webhooks/tap` | Tap payment events |

## Admin (PLATFORM_ADMIN)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/plans` | All plans |
| POST | `/admin/plans` | Create plan |
| PATCH | `/admin/plans/:id` | Update plan |
| DELETE | `/admin/plans/:id` | Delete plan |
| GET | `/admin/settings` | Platform settings (masked) |
| PUT | `/admin/settings` | Update settings + Tap keys |
| PATCH | `/admin/showrooms/:id/subscription` | Override subscription |

## System
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | DB + Storage health check |

---

## Feature Gates

| Feature | Plans |
|---|---|
| `MARKET` | Growth, Pro, Enterprise |
| `AUCTIONS` | Pro, Enterprise |
| `API` | Pro, Enterprise |
| `REPORTS_ADVANCED` | Growth, Pro, Enterprise |
| `REPORTS_FULL` | Pro, Enterprise |
| `maxCars` | Starter: 15, Growth: 50, Pro+: ∞ |

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No/invalid JWT |
| `FORBIDDEN` | 403 | No permission |
| `FEATURE_LOCKED` | 403 | Feature not in plan |
| `PLAN_LIMIT` | 403 | Car count at max |
| `VALIDATION_ERROR` | 422 | Bad input |
| `EMAIL_TAKEN` | 409 | Duplicate email |
| `NATIONAL_ID_TAKEN` | 409 | Duplicate national ID |
