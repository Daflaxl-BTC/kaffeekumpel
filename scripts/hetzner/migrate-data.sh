#!/usr/bin/env bash
# Einmaliger Umzug von Supabase Cloud (Frankfurt) auf das selbst betriebene
# Supabase auf Hetzner: Schema public mit Daten, Rechten und RLS-Policies.
#
#   SOURCE_DATABASE_URL   Supabase Cloud, Session-Pooler oder direkte Verbindung
#                         (Dashboard → Connect). Wird nur gelesen.
#   TARGET_DATABASE_URL   Postgres auf Hetzner, z. B.
#                         postgres://postgres:<pw>@127.0.0.1:5432/postgres
#   DUMP_FILE             optional, Standard ./kaffeekumpel-umzug-<zeit>.dump
#
# Warum ein Dump statt supabase/migrations: Produktion ist weiter als das
# Verzeichnis (siehe supabase/migrations/PRODUKTION.md). Der Dump nimmt den
# echten Stand mit, inklusive der direkt eingespielten Audit-Migrationen.
#
# Ablauf: Ziel muss leer sein → Dump der Quelle → Einspielen ins Ziel
# (restore-dump.sh, inkl. Realtime-Publication) → Abgleich von Zeilen,
# Rechten und Policies (verify-migration.sh).
# Bricht bei jedem Fehler ab. Die Quelle wird nie verändert.
set -euo pipefail

: "${SOURCE_DATABASE_URL:?SOURCE_DATABASE_URL fehlt}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL fehlt}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_FILE="${DUMP_FILE:-./kaffeekumpel-umzug-$(date -u +%Y%m%dT%H%M%SZ).dump}"

psql_target() {
  psql "$TARGET_DATABASE_URL" --no-psqlrc --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 "$@"
}

echo "1/4 Ziel prüfen"
existing="$(psql_target -c "select count(*) from information_schema.tables where table_schema = 'public';")"
if [[ "$existing" != "0" ]]; then
  echo "Ziel hat schon $existing Tabellen im Schema public. Abbruch, damit nichts überschrieben wird." >&2
  exit 1
fi

echo "2/4 Dump der Quelle nach $DUMP_FILE"
umask 077
pg_dump --format=custom --schema=public --no-owner --file="$DUMP_FILE" "$SOURCE_DATABASE_URL"

echo "3/4 Einspielen ins Ziel (mit Rechten und Realtime)"
"$here/restore-dump.sh" "$DUMP_FILE" "$TARGET_DATABASE_URL"

echo "4/4 Abgleich Quelle ↔ Ziel"
"$here/verify-migration.sh" "$SOURCE_DATABASE_URL" "$TARGET_DATABASE_URL"
