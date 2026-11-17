# Hetzner-Umzug — Runbook

Ziel: App und Datenbank laufen auf einem eigenen Server bei Hetzner in Deutschland. Erst danach darf
Kaffeekumpel mit „Server in Deutschland“ werben (Regel der Agentenflotte).

Stand 17.11.2026. Heute läuft Produktion auf Vercel (Frankfurt) mit Supabase Cloud (eu-central-1).

## Was im Repo liegt

| Datei | Zweck |
|---|---|
| `Dockerfile` | Next.js-Standalone-Image, setzt `HOSTING_PROVIDER=hetzner` |
| `docker-compose.yml` | App + Caddy, hängt am Netz `supabase_default` des Supabase-Stacks |
| `Caddyfile` | TLS für `kaffeekumpel.eu`/`www`; `api.kaffeekumpel.eu` gibt **nur** `/realtime/v1` frei |
| `lib/hosting.ts` | Datenschutztext Abschnitt 4 je Betriebsort (`vercel` / `hetzner`) |
| `scripts/hetzner/migrate-data.sh` | Einmaliger Umzug Supabase Cloud → Hetzner, mit Abgleich |
| `scripts/hetzner/restore-dump.sh` | Dump in ein leeres Supabase einspielen (Umzug und Wiederherstellung) |
| `scripts/hetzner/verify-migration.sh` | Zeilen je Tabelle, Rechte, RLS-Policies und Realtime vergleichen |
| `scripts/hetzner/backup.sh` + `systemd/` | Nächtliche Sicherung, 14 Tage Aufbewahrung |

Wichtig: `supabase/migrations/` ist **nicht** vollständig (siehe `supabase/migrations/PRODUKTION.md`).
Deshalb übernimmt der Umzug Schema, Rechte und Policies per `pg_dump` direkt aus Produktion statt aus
dem Migrationsordner.

## 0. Entscheidungen und Handgriffe von Felix

Diese Schritte kosten Geld oder betreffen Verträge, DNS und Produktion. Sie macht Felix.

1. **Server anlegen** in der Hetzner Cloud Console. Standort **Nürnberg oder Falkenstein** (nicht
   Helsinki, nicht USA/Singapur). Größe mit mindestens 4 vCPU und 8 GB RAM: Der Supabase-Stack braucht
   allein mehrere GB, dazu kommt Chromium für den PDF-Rückblick. Ubuntu 24.04, nur SSH-Schlüssel.
2. **Auftragsverarbeitungsvertrag** mit Hetzner in der Console abschließen (Art. 28 DSGVO). Ohne AVV
   stimmt der Datenschutztext nicht.
3. **Externe Sicherung** entscheiden: Sicherungen nur auf demselben Server schützen nicht vor dem
   Verlust des Servers. Empfehlung: Hetzner Storage Box, Standort **Deutschland** (FSN1/NBG1), weil die
   Datenschutzerklärung „ebenfalls in Deutschland“ sagt.
4. **DNS** (später, Abschnitt 5): A/AAAA-Einträge für `api.kaffeekumpel.eu` (sofort, stört nichts),
   für `kaffeekumpel.eu` und `www` erst beim Umschalten.
5. **Werte aus Vercel** (Production) für die `.env` auf dem Server kopieren, vor allem
   `SESSION_SECRET`: Bleibt er gleich, bleiben alle Mitglieder eingeloggt. Ein neuer Wert meldet alle ab.

## 1. Server-Grundeinrichtung

```bash
# als root, einmalig
apt update && apt -y full-upgrade
apt -y install unattended-upgrades ufw git
dpkg-reconfigure -plow unattended-upgrades
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
curl -fsSL https://get.docker.com | sh
```

**Achtung Docker und ufw:** Von Docker veröffentlichte Ports umgehen ufw. Darum alle Supabase-Ports nur
an `127.0.0.1` binden (Abschnitt 2) und am Ende von außen prüfen, dass nur 22, 80 und 443 offen sind.

Postgres-Client für die Skripte, passend zur Postgres-Hauptversion im Supabase-Stack (nach Abschnitt 2
mit `docker exec supabase-db postgres --version` prüfen; `pg_dump` muss gleich alt oder neuer sein):

```bash
apt -y install postgresql-common && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
apt -y install postgresql-client-17   # Hauptversion anpassen
```

## 2. Supabase selbst betreiben

Nach der offiziellen Anleitung „Self-Hosting with Docker“ (supabase.com/docs/guides/self-hosting/docker):

```bash
mkdir -p /opt && cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker && cp .env.example .env
```

In `/opt/supabase/docker/.env` mindestens setzen:

- `POSTGRES_PASSWORD`, `JWT_SECRET` (mindestens 32 Zeichen), daraus `ANON_KEY` und `SERVICE_ROLE_KEY`
  erzeugen (Generator in der Supabase-Anleitung), `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`,
  `POOLER_TENANT_ID`.
- `API_EXTERNAL_URL=https://api.kaffeekumpel.eu` und `SUPABASE_PUBLIC_URL=https://api.kaffeekumpel.eu`.

In `/opt/supabase/docker/docker-compose.yml` die veröffentlichten Ports auf localhost binden, z. B. bei
Kong `127.0.0.1:${KONG_HTTP_PORT}:8000` und `127.0.0.1:${KONG_HTTPS_PORT}:8443`, beim Pooler
`127.0.0.1:${POSTGRES_PORT}:5432` und `127.0.0.1:${POOLER_PROXY_PORT_TRANSACTION}:6543`. Studio ist dann
nur per SSH-Tunnel erreichbar (`ssh -L 8000:127.0.0.1:8000 server`).

```bash
docker compose up -d          # legt das Netz supabase_default an
docker compose ps             # alle Dienste healthy?
ss -tlnp | grep -v 127.0.0.1  # nur 22, 80, 443 dürfen nach außen offen sein
```

Verbindung für die Skripte (Pooler im Session-Modus):

```
postgres://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@127.0.0.1:5432/postgres
```

## 3. App einrichten

```bash
cd /opt && git clone https://github.com/Daflaxl-BTC/kaffeekumpel && cd kaffeekumpel
cp .env.example .env && chmod 600 .env
```

`/opt/kaffeekumpel/.env`:

| Variable | Wert |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://api.kaffeekumpel.eu` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ANON_KEY` aus der Supabase-`.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` aus der Supabase-`.env` |
| `SUPABASE_JWT_SECRET` | `JWT_SECRET` aus der Supabase-`.env` (signiert die Realtime-Tokens) |
| `SESSION_SECRET` | **derselbe Wert wie in Vercel** |
| übrige (`ANTHROPIC_API_KEY`, `IOS_APP_ID`, Impressum …) | aus Vercel übernehmen |

`HOSTING_PROVIDER=hetzner` und `SUPABASE_INTERNAL_URL=http://kong:8000` setzen Dockerfile und
`docker-compose.yml` selbst.

## 4. Probelauf (Produktion bleibt auf Vercel)

1. DNS-Eintrag `api.kaffeekumpel.eu` und für den Test `neu.kaffeekumpel.eu` auf den Server zeigen lassen.
   Für den Probelauf `neu.kaffeekumpel.eu` auf dem Server in die erste Zeile des `Caddyfile` ergänzen
   (nicht committen).
2. Daten übernehmen:
   ```bash
   cd /opt/kaffeekumpel
   export SOURCE_DATABASE_URL='<Supabase Cloud, Dashboard → Connect → Session pooler>'
   export TARGET_DATABASE_URL='postgres://postgres.<tenant>:<pw>@127.0.0.1:5432/postgres'
   DUMP_FILE=/root/umzug-probe.dump scripts/hetzner/migrate-data.sh
   ```
   Das Skript liest die Quelle nur, bricht ab, wenn das Ziel nicht leer ist, und endet mit
   **„Abgleich ok“** (Zeilen je Tabelle, Rechte von anon/authenticated, RLS-Policies, Realtime).
3. App starten: `docker compose up -d --build`, dann `docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile`.
4. Rauchtest auf `https://neu.kaffeekumpel.eu`:
   - Gruppe öffnen, Kaffee buchen; in einem zweiten Browser erscheint die Buchung ohne Neuladen (Realtime).
   - Einkauf buchen, Abrechnung erzeugen, PayPal-Link öffnet richtig.
   - QR-Code unter `/api/qr/<slug>` lädt, PDF-Rückblick lädt.
   - `/datenschutz` zeigt Abschnitt 4 mit Hetzner und „Stand: 17. November 2026“.
   - `/.well-known/apple-app-site-association` liefert JSON.
   - `curl -s https://api.kaffeekumpel.eu/rest/v1/` liefert 404 (nur Realtime ist offen).
5. Probe-Daten verwerfen, damit der echte Umzug auf leerem Ziel startet:
   ```bash
   cd /opt/supabase/docker && docker compose down -v && rm -rf volumes/db/data && docker compose up -d
   ```
   Den Eintrag `neu.kaffeekumpel.eu` wieder aus dem `Caddyfile` nehmen.

## 5. Umschalten

Zur ruhigsten Zeit (zuletzt rund 30 Buchungen pro Woche). Einen Tag vorher die DNS-TTL von
`kaffeekumpel.eu` und `www` auf 300 Sekunden senken.

1. **Schreibstopp:** Felix pausiert das Vercel-Projekt. Ab jetzt kann niemand mehr in Supabase Cloud
   schreiben, sonst gingen Buchungen zwischen Dump und Umschalten verloren.
2. Ziel leer? Sonst Abschnitt 4, Schritt 5.
3. `scripts/hetzner/migrate-data.sh` wie im Probelauf. Ohne „Abgleich ok“ nicht weitermachen.
4. Felix stellt die A/AAAA-Einträge von `kaffeekumpel.eu` und `www` auf den Server.
5. `docker compose up -d --build` (falls noch nicht laufend), Rauchtest aus Abschnitt 4 auf
   `https://www.kaffeekumpel.eu`. Die iOS-App spricht `www.kaffeekumpel.eu` an und folgt dem DNS.
6. Nach dem Rauchtest: Sicherung einrichten (Abschnitt 6) und einmal von Hand auslösen.
7. Supabase Cloud und Vercel zwei Wochen pausiert als Rückweg behalten, dann löscht Felix sie.
   Erst ab jetzt darf die Werbung „Server in Deutschland“ sagen.

### Rückweg

Solange Supabase Cloud und Vercel nur pausiert sind: DNS zurückstellen und Vercel fortsetzen. Buchungen,
die seit dem Umschalten auf Hetzner entstanden sind, fehlen dann in Supabase Cloud. In den ersten Tagen
sind das wenige; vor dem Zurückstellen mit `verify-migration.sh <hetzner> <cloud>` ansehen, welche
Tabellen abweichen, und entscheiden.

## 6. Sicherung

```bash
install -d -m 700 /etc/kaffeekumpel
printf 'DATABASE_URL=%s\n' 'postgres://postgres.<tenant>:<pw>@127.0.0.1:5432/postgres' > /etc/kaffeekumpel/backup.env
chmod 600 /etc/kaffeekumpel/backup.env
cp /opt/kaffeekumpel/scripts/hetzner/systemd/kaffeekumpel-backup.* /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now kaffeekumpel-backup.timer
systemctl start kaffeekumpel-backup.service && journalctl -u kaffeekumpel-backup -n 20
```

- Jede Nacht um 03:17 (± 10 Minuten) entsteht `/var/backups/kaffeekumpel/kaffeekumpel-<zeit>.dump`
  (Schema `public`, Format custom). Die Datei wird vor dem Umbenennen mit `pg_restore --list` geprüft.
- Aufbewahrung `KEEP_DAYS=14`. Die Datenschutzerklärung nennt 14 Tage; wer den Wert ändert, ändert
  `lib/hosting.ts` mit (ein Test prüft das).
- Externe Kopie (Storage Box, falls Felix sie bucht), z. B. per `rsync` im Anschluss an den Timer.

**Wiederherstellen** (z. B. auf einem neuen Server nach Abschnitt 1–2, Ziel leer):

```bash
scripts/hetzner/restore-dump.sh /var/backups/kaffeekumpel/<datei>.dump "$TARGET_DATABASE_URL"
```

Einmal im Monat den Ernstfall üben: auf dem Server ein zweites, leeres Supabase oder einen Testserver
nehmen, die letzte Sicherung einspielen und die Zeilenzahlen mit Produktion vergleichen.

## 7. Updates

- Betriebssystem: `unattended-upgrades` spielt Sicherheitsupdates ein. Monatlich `apt full-upgrade`
  und bei Kernel-Updates neu starten.
- App: `cd /opt/kaffeekumpel && git pull && docker compose up -d --build`.
- Caddy: `docker compose pull caddy && docker compose up -d caddy`.
- Supabase: Changelog lesen, Sicherung auslösen, dann
  `cd /opt/supabase/docker && git pull && docker compose pull && docker compose up -d`.
  Danach Rauchtest (Realtime!).

## 8. Bekannte Lücken

- `supabase/migrations/` fehlt der Stand der Audit-Migrationen aus Produktion. Für den Umzug egal
  (Dump), für ein frisches Entwicklungs-Setup nicht. Eigener Backlog-Eintrag.
- Docker-Logs der App rotieren ohne Einstellung nicht. In `/etc/docker/daemon.json`
  `{"log-driver":"local"}` setzen (rotiert automatisch).
