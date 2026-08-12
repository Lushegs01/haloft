#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres and runs the flow tests.
#
#   bash scripts/verify-migrations.sh
#
# Needs a reachable Postgres 14+ and psql. Point it somewhere with
# PGHOST/PGPORT/PGUSER, or let it use your local defaults. The database
# named below is DROPPED and recreated on every run.
set -euo pipefail

DB="${HALOFT_TEST_DB:-haloft_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "→ recreating $DB"
psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null
psql -q -d postgres -c "CREATE DATABASE $DB" >/dev/null

echo "→ Supabase stand-ins"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/scripts/test-db/00_supabase_stub.sql" >/dev/null

for f in "$ROOT"/src/db/migrations/*.sql; do
  printf '→ %s\n' "$(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" 2>&1 | grep -vE 'NOTICE:.*(skipping|already exists)' || true
done

echo "→ flow tests"
psql -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/scripts/test-db/01_flows.sql"
