#!/bin/sh
# ─────────────────────────────────────────────────────────────
# CarSell — container entrypoint
# Runs DB migrations, then starts the Next.js standalone server.
# ─────────────────────────────────────────────────────────────
set -e

echo "→ Running database migrations (prisma migrate deploy)..."
# Use the prisma CLI bundled in the runtime image.
node node_modules/prisma/build/index.js migrate deploy || {
  echo "✗ Migration failed — aborting startup."
  exit 1
}
echo "✓ Migrations applied."

echo "→ Starting CarSell server on :${PORT:-3000}..."
exec node server.js
