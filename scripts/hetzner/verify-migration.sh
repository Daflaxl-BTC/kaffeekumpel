#!/usr/bin/env bash
# Abgleich nach dem Datenumzug, nur lesend. Prüft im Schema public:
#   1. Zeilenzahl je Tabelle (Zählerabgleich),
#   2. Tabellenrechte der Client-Rollen anon und authenticated,
#   3. RLS-Policies (Name, Befehl, Rollen, Bedingung),
#   4. public.events in der Publication supabase_realtime (sonst bleibt die
#      Live-Strichliste stumm).
#
#   verify-migration.sh <SOURCE_DATABASE_URL> <TARGET_DATABASE_URL>
#
# Exit 0 nur, wenn alles übereinstimmt. Sonst Exit 1.
# Hinweis: Schreibt jemand während des Umzugs in die Quelle, weicht der
# Zähler ab. Dann Umzug auf leerem Ziel wiederholen (docs/HETZNER.md).
set -euo pipefail

if (( $# != 2 )); then
  echo "Aufruf: $0 <SOURCE_DATABASE_URL> <TARGET_DATABASE_URL>" >&2
  exit 2
fi
source_url="$1"
target_url="$2"

# Eine Abfrage je Datenbank: "tabelle|zeilen", sortiert.
count_sql="
select c.table_name || '|' || (xpath('/row/n/text()',
         query_to_xml(format('select count(*) as n from public.%I', c.table_name), false, true, '')))[1]::text
  from information_schema.tables c
 where c.table_schema = 'public' and c.table_type = 'BASE TABLE'
 order by c.table_name;"

grants_sql="
select grantee || '|' || table_name || '|' || string_agg(privilege_type, ',' order by privilege_type)
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated')
 group by grantee, table_name
 order by 1;"

policies_sql="
select tablename || '|' || policyname || '|' || cmd || '|' || permissive || '|' || roles::text
       || '|' || coalesce(qual, '') || '|' || coalesce(with_check, '')
  from pg_policies
 where schemaname = 'public'
 order by 1;"

run() {
  psql "$1" --no-psqlrc --quiet --tuples-only --no-align --set ON_ERROR_STOP=1 -c "$2"
}
counts() { run "$1" "$count_sql"; }

src_file="$(mktemp)"
dst_file="$(mktemp)"
trap 'rm -f "$src_file" "$dst_file"' EXIT
counts "$source_url" > "$src_file"
counts "$target_url" > "$dst_file"

if [[ ! -s "$src_file" ]]; then
  echo "Quelle hat keine Tabellen im Schema public — falsche URL?" >&2
  exit 1
fi

status=0
printf '%-24s %10s %10s  %s\n' "Tabelle" "Quelle" "Ziel" "Ergebnis"
while IFS='|' read -r table src_n; do
  dst_n="$(awk -F'|' -v t="$table" '$1 == t { print $2 }' "$dst_file")"
  if [[ -z "$dst_n" ]]; then
    printf '%-24s %10s %10s  %s\n' "$table" "$src_n" "-" "FEHLT"
    status=1
  elif [[ "$src_n" != "$dst_n" ]]; then
    printf '%-24s %10s %10s  %s\n' "$table" "$src_n" "$dst_n" "ABWEICHUNG"
    status=1
  else
    printf '%-24s %10s %10s  %s\n' "$table" "$src_n" "$dst_n" "ok"
  fi
done < "$src_file"

# diff_section <Titel> <SQL>: gleiche Ausgabe in Quelle und Ziel verlangt.
diff_section() {
  local title="$1" sql="$2" a b
  a="$(mktemp)"; b="$(mktemp)"
  run "$source_url" "$sql" > "$a"
  run "$target_url" "$sql" > "$b"
  if diff -u --label Quelle --label Ziel "$a" "$b"; then
    echo "$title: gleich"
  else
    echo "$title: ABWEICHUNG (siehe oben, - Quelle / + Ziel)" >&2
    status=1
  fi
  rm -f "$a" "$b"
}
diff_section "Rechte anon/authenticated" "$grants_sql"
diff_section "RLS-Policies" "$policies_sql"

realtime="$(run "$target_url" \
  "select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events';")"
if [[ "$realtime" == "1" ]]; then
  echo "Realtime: public.events ist in supabase_realtime"
else
  echo "Realtime: public.events fehlt in supabase_realtime" >&2
  status=1
fi

if (( status == 0 )); then
  echo "Abgleich ok"
else
  echo "Abgleich FEHLGESCHLAGEN" >&2
fi
exit "$status"
