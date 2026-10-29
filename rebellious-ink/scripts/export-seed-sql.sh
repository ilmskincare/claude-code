#!/usr/bin/env bash
# Produces a data-only SQL dump of a freshly seeded LOCAL database so the same
# fictional TEST data can be loaded into a staging database that is only reachable
# through an HTTPS management API (no direct Postgres connection from CI).
set -euo pipefail
DB_URL="${1:-postgresql://postgres@localhost:5433/rebellious_ink_test}"
OUT="${2:-/tmp/rebellious-ink-seed.sql}"
export DATABASE_URL="$DB_URL"
npx prisma migrate reset --force --skip-seed >/dev/null
STORAGE_LOCAL_DIR=./storage-test npx tsx prisma/seed.ts >/dev/null
pg_dump "$DB_URL" --data-only --inserts --no-owner --no-privileges \
  --exclude-table='_prisma_migrations' --exclude-table='restricted.*' \
  --schema=public > "$OUT"
echo "Wrote $OUT ($(wc -l < "$OUT") lines)"
