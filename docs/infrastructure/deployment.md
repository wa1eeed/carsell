# Deployment Guide — CarLink

Target: **VPS via Coolify** (per CLAUDE.md). Docker-based, Next.js standalone.

---

## Prerequisites

1. A VPS (2GB+ RAM) with Coolify installed
2. A PostgreSQL database (Coolify can provision one, or managed e.g. Supabase/Neon)
3. Cloudflare R2 bucket + API tokens
4. Domain `carlink.sa` with DNS managed (Cloudflare recommended)
5. Tap.company account (test + live keys)

---

## DNS Setup

Point these at your VPS IP:

| Record | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | `<VPS_IP>` | Root domain (carlink.sa) |
| A | `app` | `<VPS_IP>` | Dashboard (app.carlink.sa) |
| A | `admin` | `<VPS_IP>` | Super Admin (admin.carlink.sa) |
| A | `*` | `<VPS_IP>` | Wildcard for {slug}.carlink.sa showrooms |

The wildcard `*.carlink.sa` is **essential** — it makes every showroom subdomain
resolve without per-showroom DNS changes.

For **custom domains** (dealers' own domains), they point their A record at `<VPS_IP>`
and add a TXT record for verification — see `app.carlink.sa/settings`.

---

## Coolify Setup

### 1. Create the application
- New Resource → Application → from Git repository
- Build pack: **Dockerfile**
- Base directory: `apps/web`
- Dockerfile location: `apps/web/Dockerfile`
- Port: `3000`

### 2. Environment variables
Set these in Coolify's Environment tab (NOT in the repo):

```
DATABASE_URL=postgresql://user:pass@host:5432/carlink_prod
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://app.carlink.sa
ROOT_DOMAIN=carlink.sa
NODE_ENV=production

# Storage (Cloudflare R2)
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=carlink-prod
R2_PUBLIC_URL=https://media.carlink.sa

# Tap.company — set these from Super Admin Settings after first deploy,
# OR seed them here as fallback
TAP_SECRET_KEY=sk_live_...
TAP_PUBLIC_KEY=pk_live_...
TAP_ENV=live

# Custom domain DNS targets
PLATFORM_IP=<VPS_IP>
PLATFORM_CNAME=cname.carlink.sa

# Cron secret (for media cleanup)
CRON_SECRET=<openssl rand -hex 32>

# Media cleanup default
MEDIA_DELETE_AFTER_DAYS=30
```

### 3. Domains
Add all four domains in Coolify, all pointing to this app:
- `carlink.sa`, `www.carlink.sa`
- `app.carlink.sa`
- `admin.carlink.sa`
- `*.carlink.sa` (wildcard — Coolify supports wildcard certs via DNS challenge)

Coolify auto-provisions Let's Encrypt SSL.

### 4. Health check
Already configured in Dockerfile (`/api/health`). Coolify uses it for zero-downtime deploys.

---

## Database Migrations

Migrations are NOT run automatically by the container. Run them via Coolify's
"Execute Command" or a post-deploy hook:

```bash
npx prisma migrate deploy
```

For the **first deploy**, also seed the plans:
```bash
npx prisma db seed
```

⚠️ Never run `migrate dev` or `db push` against production. Only `migrate deploy`.

---

## Cron Job — Media Cleanup

Set up a daily cron (Coolify Scheduled Tasks or external) to clean expired car media:

```bash
# Daily at 03:00 KSA (00:00 UTC)
curl -X POST https://app.carlink.sa/api/v1/admin/cleanup/media \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Post-Deploy Checklist

- [ ] `https://app.carlink.sa/api/health` returns `{"ok":true}`
- [ ] Login works at `app.carlink.sa/login`
- [ ] A showroom resolves at `carlink.sa/{slug}` and `{slug}.carlink.sa`
- [ ] Super Admin loads at `admin.carlink.sa` (PLATFORM_ADMIN only)
- [ ] Tap test payment completes end-to-end
- [ ] R2 image upload works (add a car with photos)
- [ ] Set production Tap keys in Super Admin → Settings (switch env to "live")

---

## Environments

| | Dev | Staging | Production |
|---|---|---|---|
| Domain | localhost:3000 | staging.carlink.sa | carlink.sa |
| Branch | feature/* | main | release tag |
| Tap | test keys | test keys | **live keys** |
| Deploy | manual | auto on push | manual + approval |

Never let an untested migration reach Production before Staging.
