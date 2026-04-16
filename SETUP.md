# Kaffeekumpel — Setup in ~10 Minuten

Diese Anleitung führt dich vom geclonten Repo zum laufenden Dev-Server und dann zu Production auf Vercel.

## Was schon erledigt ist

- ✅ Supabase-Projekt `kaffeekumpel` angelegt (`ahhpzhgnqgggqnawiojk`, EU-Frankfurt)
- ✅ DB-Schema eingespielt (groups, members, products, events, settlements, debts)
- ✅ RLS-Policies aktiv (Read public, Write nur Service-Role)
- ✅ Realtime-Publication für `events` aktiviert

## Was du noch tun musst

### 1. Code lokal ablegen

Entpacke `kaffeekumpel.zip` (oder kopiere den Ordner `kaffeekumpel/`) nach `~/projects/kaffeekumpel/` — Pfad egal, nimm was dir gefällt.

### 2. Node 20+ sicherstellen

```bash
node --version   # sollte ≥ 20.x sein
```

### 3. Dependencies installieren

```bash
cd ~/projects/kaffeekumpel
npm install
```

### 4. `.env.local` anlegen

```bash
cp .env.example .env.local
```

Die `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` sind schon ausgefüllt. Du musst noch **zwei** Werte ergänzen:

**`SUPABASE_SERVICE_ROLE_KEY`** — das ist der mächtige Key, der RLS bypasst. Den gibt's nicht per MCP, du musst ihn aus dem Dashboard holen:

1. Öffne https://supabase.com/dashboard/project/ahhpzhgnqgggqnawiojk/settings/api
2. Scroll zu "Service role key" → **Reveal** klicken → kopieren
3. Einfügen in `.env.local` als `SUPABASE_SERVICE_ROLE_KEY=ey...`

**`SESSION_SECRET`** — signiert die Session-Cookies. Generieren:

```bash
openssl rand -base64 32
```

In `.env.local` als `SESSION_SECRET=<ergebnis>` eintragen.

### 5. Dev-Server starten

```bash
npm run dev
```

→ http://localhost:3000 öffnen. Du solltest die Landingpage sehen.

### 6. Happy-Path-Test (5 Min)

1. Klick auf **"Kostenlose Gruppe anlegen"**
2. Gruppenname: `Test-WG`, Dein Name: `Felix`, Preis: 0.30 → Anlegen
3. Du landest auf `/g/XXXXXX` mit Willkommens-Banner und QR-Link
4. Tipp **"Kaffee"** — grüner Toast erscheint, Aktivitäts-Feed aktualisiert sich
5. **"Einkauf eintragen"** → "Bohnen" / 12,99 / Notiz "Dallmayr" → +
6. Inkognito-Fenster öffnen: `http://localhost:3000/g/XXXXXX` → du landest auf Join
7. "Ich bin neu" → Name "Anna" → Beitreten
8. Als Anna 3 x Kaffee tippen
9. Zurück ins ursprüngliche Browser-Tab → Aktivität von Anna erscheint live (oder nach Refresh — Realtime bis Dashboard-Aktivierung in Schritt 7 unten fallback auf Focus-Refresh)
10. **"Abrechnung ansehen"** → Saldi ausgeglichen: Felix hat ~ +12,00 €, Anna hat −0,90 € etc.
11. Im Anna-Tab: Profil → PayPal-Handle "felixbredl" eintragen → Speichern
12. Nochmal Abrechnung → Anna sieht jetzt einen **"Per PayPal zahlen"-Button**

### 7. Realtime explizit aktivieren (falls nicht bereits)

Im Supabase-Dashboard:
- https://supabase.com/dashboard/project/ahhpzhgnqgggqnawiojk/database/replication
- `supabase_realtime` → Tabelle `events` → Toggle ON

Die Migration versucht das bereits per SQL, aber manche UI-Stände überschreiben das — lieber einmal checken.

### 8. Tests laufen lassen

```bash
npm run test
```

Sollte 20+ Tests grün zeigen.

### 9. Git initialisieren

```bash
git init
git add -A
git commit -m "Initial MVP: Kaffeekumpel — QR-Kaffeekasse mit Supabase+Next"
```

Optional auf GitHub pushen:

```bash
gh repo create kaffeekumpel --private --source=. --push
```

### 10. Deployment auf Vercel

```bash
npx vercel
# folge den Prompts: link to new project "kaffeekumpel"
```

Environment Variables setzen:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add SESSION_SECRET production
npx vercel env add NEXT_PUBLIC_APP_URL production   # = deine kaffeekumpel.vercel.app oder custom Domain
```

Und deployen:

```bash
npx vercel --prod
```

### 11. Domain (optional, aber empfohlen)

- **kaffeekumpel.de** bei INWX/Netcup o.ä. (~10 €/Jahr).
- In Vercel unter Settings → Domains hinzufügen.
- `NEXT_PUBLIC_APP_URL` auf die Domain updaten.

### 12. Holzschild-QR erzeugen

Nach dem Deploy:

```
https://kaffeekumpel.de/api/qr/XXXXXX?format=svg
```

→ SVG runterladen, an jeden Gravur-Dienstleister schicken (Tischlerschuppen, Moritz Laserworks, Laser-Design24). Fehlerkorrektur ist bereits auf Level H gesetzt, das überlebt Kratzer.

## Troubleshooting

**Login-Loop** (immer wieder auf `/join` redirected)
→ `SESSION_SECRET` ist zu kurz (< 32 Zeichen) oder hat beim Deploy andere Werte als lokal. Neu setzen, Cookies löschen.

**"service role key fehlt"**
→ Du hast die `.env.local` aus Schritt 4 noch nicht richtig ausgefüllt. `.env.local` nicht einchecken (steht in `.gitignore`).

**Realtime zeigt "Offline"**
→ Schritt 7 prüfen. Netzwerk-Tab öffnen — es sollte eine WebSocket-Verbindung zu `ahhpzhgnqgggqnawiojk.supabase.co` laufen.

**PayPal-Link öffnet sich nicht / "Betrag nicht unterstützt"**
→ Manche PayPal-Apps haben Probleme mit winzigen Beträgen (<1 €). In solchen Fällen manuell via PayPal-App begleichen.

## Next Steps (nicht im MVP)

- **Magic-Link-Auth** via Resend (Cross-Device Session-Recovery)
- **Monats-Mail** (Resend Template) mit Abrechnung
- **Admin-Dashboard** (Mitglieder kicken, Gruppe umbenennen, Preis ändern)
- **Holzschild-Shop** (Stripe Checkout + Fulfillment-Partner)
- **PWA-Manifest** damit "Zum Homescreen hinzufügen" sauber aussieht
