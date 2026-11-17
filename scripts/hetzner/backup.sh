#!/usr/bin/env bash
# Nächtliche Sicherung der Kaffeekumpel-Datenbank (Schema public) auf Hetzner.
#
#   DATABASE_URL   Pflicht. postgres://postgres:<pw>@127.0.0.1:5432/postgres
#   BACKUP_DIR     Zielordner, Standard /var/backups/kaffeekumpel
#   KEEP_DAYS      Aufbewahrung in Tagen, Standard 14. Die Datenschutzerklärung
#                  (lib/hosting.ts) nennt 14 Tage — nur zusammen ändern.
#
# Läuft per systemd-Timer (scripts/hetzner/systemd). Schreibt erst in eine
# temporäre Datei, prüft sie mit pg_restore --list und benennt sie dann um;
# eine kaputte Sicherung ersetzt also nie eine gute. Gelöscht werden nur
# Dateien nach dem Muster kaffeekumpel-*.dump, die älter als KEEP_DAYS sind.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL fehlt}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kaffeekumpel}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if ! [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] || (( KEEP_DAYS < 1 )); then
  echo "KEEP_DAYS muss eine ganze Zahl ≥ 1 sein, ist: $KEEP_DAYS" >&2
  exit 2
fi

umask 077
mkdir -p "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/kaffeekumpel-$stamp.dump"
tmp="$target.partial"
trap 'rm -f "$tmp"' EXIT

pg_dump --format=custom --schema=public --no-owner --file="$tmp" "$DATABASE_URL"
pg_restore --list "$tmp" > /dev/null
mv "$tmp" "$target"
trap - EXIT

# Aufbewahrung: alles älter als KEEP_DAYS * 24 h.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'kaffeekumpel-*.dump' \
  -mmin +"$(( KEEP_DAYS * 24 * 60 ))" -print -delete

size="$(du -h "$target" | cut -f1)"
count="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'kaffeekumpel-*.dump' | wc -l)"
echo "Sicherung ok: $target ($size), $count Sicherungen vorhanden"
