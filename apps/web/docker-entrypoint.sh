#!/bin/sh
# ─────────────────────────────────────────────────────────────
# CarSell — container entrypoint
# Runs DB migrations, optionally seeds, then starts the server.
# ─────────────────────────────────────────────────────────────
set -e

echo "→ Running database migrations (prisma migrate deploy)..."
node node_modules/prisma/build/index.js migrate deploy || {
  echo "✗ Migration failed — aborting startup."
  exit 1
}
echo "✓ Migrations applied."

# Optional seed on startup (idempotent — upserts plans, catalog, super admin).
# Set SEED_ON_START=true in the environment to enable.
# Super admin is created only if SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD are set.
if [ "$SEED_ON_START" = "true" ]; then
  if [ -f prisma/seed.mjs ]; then
    echo "→ Seeding database (SEED_ON_START=true)..."
    node prisma/seed.mjs || echo "⚠ Seed failed (non-fatal) — continuing startup."
  else
    echo "⚠ SEED_ON_START=true but prisma/seed.mjs not found — skipping."
  fi
fi

echo "→ Starting CarSell server on :${PORT:-3000}..."
exec node server.js
