#!/usr/bin/env bash
# Spielt einen Dump (pg_dump --format=custom --schema=public) in ein Supabase
# mit LEEREM Schema public ein. Genutzt vom Umzug (migrate-data.sh) und zum
# Wiederherstellen einer nächtlichen Sicherung (backup.sh, docs/HETZNER.md).
#
#   restore-dump.sh <DUMP_FILE> <TARGET_DATABASE_URL>
#
# Danach steht public.events in der Publication supabase_realtime.
# Bricht ab, wenn das Ziel schon Tabellen in public hat.
set -euo pipefail

if (( $# != 2 )); then
  echo "Aufruf: $0 <DUMP_FILE> <TARGET_DATABASE_URL>" >&2
  exit 2
fi
DUMP_FILE="$1"
TARGET_DATABASE_URL="$2"

existing="$(psql "$TARGET_DATABASE_URL" --no-psqlrc --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 \
  -c "select count(*) from information_schema.tables where table_schema = 'public';")"
if [[ "$existing" != "0" ]]; then
  echo "Ziel hat schon $existing Tabellen im Schema public. Abbruch, damit nichts überschrieben wird." >&2
  exit 1
fi

# Zwei Fallen beim Einspielen:
# - Das Schema public gibt es im Ziel schon; nur seinen Eintrag auslassen.
# - Supabase vergibt im Ziel per Default-Privileges ALL an anon, authenticated
#   und service_role für jede neue Tabelle. Produktion hat davon Rechte
#   entzogen (z. B. members, siehe PRODUKTION.md). Darum: erst alles ohne
#   Rechte einspielen, dann die Client-Rollen leerräumen, dann genau die
#   Rechte aus dem Dump setzen. Alles in einer Transaktion.
main_list="$(mktemp)"
acl_list="$(mktemp)"
restore_sql="$(mktemp)"
trap 'rm -f "$main_list" "$acl_list" "$restore_sql"' EXIT
pg_restore --list "$DUMP_FILE" | grep -vE '^[0-9]+; [0-9]+ [0-9]+ SCHEMA - public ' | grep -v ' ACL ' > "$main_list"
pg_restore --list "$DUMP_FILE" | grep ' ACL ' > "$acl_list" || true
# Erst vollständig als SQL-Datei bauen (bricht bei Fehler hier ab), dann in
# einer Transaktion einspielen — so landet nie ein halber Stand im Ziel.
{
  pg_restore --no-owner --use-list="$main_list" --file=- "$DUMP_FILE"
  cat <<'SQL'
revoke all on all tables    in schema public from anon, authenticated, service_role;
revoke all on all sequences in schema public from anon, authenticated, service_role;
revoke all on all functions in schema public from anon, authenticated, service_role;
SQL
  pg_restore --no-owner --use-list="$acl_list" --file=- "$DUMP_FILE"
} > "$restore_sql"
psql "$TARGET_DATABASE_URL" --no-psqlrc --quiet --single-transaction --set ON_ERROR_STOP=1 \
  --file="$restore_sql" > /dev/null

# Live-Strichliste: events muss in der Realtime-Publication stehen.
psql "$TARGET_DATABASE_URL" --no-psqlrc --quiet --set ON_ERROR_STOP=1 <<'SQL'
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Publication supabase_realtime fehlt im Ziel — läuft dort Supabase?';
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
SQL

echo "Eingespielt: $DUMP_FILE → Ziel"
