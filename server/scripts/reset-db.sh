#!/usr/bin/env bash
set -e
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
node scripts/migrate.js
node scripts/seed.js
