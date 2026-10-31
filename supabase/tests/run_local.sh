#!/bin/bash
# Rebuilds a throwaway PostgreSQL database from the migrations, then runs the security tests.
# Needs a running PostgreSQL 14+ server you can reach with psql. It NEVER targets Supabase.
#   Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres ./supabase/tests/run_local.sh
set -u
cd "$(dirname "$0")/../.."
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"
DB="beingu_local_test"
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB;" -c "create database $DB;" || exit 1
PSQL="psql -q -v ON_ERROR_STOP=1 -d $DB"
for f in supabase/tests/00_local_supabase_stub.sql supabase/migrations/0001_foundation.sql supabase/seed.sql \
         supabase/migrations/0002_interest_library.sql supabase/migrations/0003_save_my_interests.sql; do
  $PSQL -f "$f" || { echo "BUILD FAILED at $f"; exit 1; }
done
for t in supabase/tests/10_rls_security.sql supabase/tests/20_save_interests.sql supabase/tests/30_interest_pages.sql; do
  $PSQL -f "$t" > /tmp/beingu_test_out.txt 2>&1
  echo "$t: pass=$(grep -cE 'NOTICE: +PASS' /tmp/beingu_test_out.txt) fail=$(grep -cE 'NOTICE: +FAIL' /tmp/beingu_test_out.txt) errors=$(grep -c ' ERROR' /tmp/beingu_test_out.txt)"
  grep -E 'NOTICE: +FAIL| ERROR' /tmp/beingu_test_out.txt || true
done
