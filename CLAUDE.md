# CLAUDE.md — Kaffeekumpel Arbeitsleitfaden

Dieser Guide ist für Claude (und jeden anderen Entwickler), der an Kaffeekumpel weiterarbeitet.

## Projektvision (1-Satz)

Kaffeekumpel digitalisiert die analoge WG-/Büro-Kaffeekasse per QR-Code und verrechnet automatisch — **ohne dass sich irgendwer einen Account anlegen muss.**

## Kern-Entscheidungen

1. **Account-less via Slug + Cookie:**
   Jede Gruppe hat einen 6-stelligen Crockford-Base32-Slug (z. B. `H3K7QP`).
   Wer die URL `/g/H3K7QP` kennt, ist drin. Das signierte Cookie merkt, welches Mitglied man ist.
   Magic-Link kommt erst in v2 für Cross-Device-Recovery.

2. **PayPal.me Deep-Links statt Payment Processing:**
   Wir speichern nur den PayPal-Handle (z. B. `felixbredl`) und öffnen
   `https://paypal.me/felixbredl/5,20EUR` — damit brauchen wir keine Finanzdienstleister-Lizenz.

3. **Supabase + Next.js + Vercel:**
   Gratis-Stack, EU-DSGVO-ready, Realtime out-of-the-box.
   Service-Role-Key auf Server-Actions, Anon-Key hat RLS-bedingt nur Lese-Rechte.

4. **Settlement = Greedy-Minimierung:**
   Wir reduzieren n² potenzielle Überweisungen auf ~n Überweisungen,
   indem der größte Schuldner dem größten Gläubiger überweist. Rundungssicher in Cents.

## Datenmodell (Public Schema)

| Tabelle       | Zweck |
|---------------|-------|
| `groups`      | Eine WG / Büro / Crew. `slug` ist der öffentliche Identifier. |
| `members`     | Personen in einer Gruppe (name, optional email, paypal_handle). |
| `products`    | Bohnen, Milch, Filter … — Auto-Katalog pro Gruppe. |
| `events`      | Zentrale Timeline: `coffee`, `cleaning`, `refill`, `purchase`. |
| `settlements` | Abrechnungs-Runden (Wochenabschluss o.ä.). |
| `debts`       | Einzel-Überweisungen aus einem Settlement. |

Siehe `supabase/migrations/` für das vollständige Schema.

## Code-Layout

```
app/                    # Next.js App Router (Pages + Server Actions)
  page.tsx              # Landing
  new/                  # Gruppe anlegen (3-Screen-Flow)
  g/[slug]/             # Gruppenansicht, Join, Settlement, Profil
  api/qr/[slug]/        # QR-Code als PNG/SVG für Holzschild-Gravur

components/             # UI-Komponenten (Server + Client gemischt)
hooks/                  # React Hooks (Realtime)
lib/
  slug.ts               # Crockford-Base32 Generator
  cleaning.ts           # "Wer ist dran?" Rotationslogik
  settlement/
    calculate.ts        # Salden → minimale Überweisungen
    paypal.ts           # paypal.me Deep-Link Builder
  auth/
    session.ts          # Signiertes JWT im HttpOnly-Cookie
  supabase/
    client.ts           # Browser-Client (Realtime)
    server.ts           # Server-Client mit service_role

supabase/migrations/    # DDL-Migrationen
tests/                  # Vitest-Tests für Business-Logik
```

## Konventionen

- **Server-Actions schreiben, RSC liest.** Keine Write-Fetches vom Client aus.
- **Preise immer in Cents** als Integer. Float-Rechnung ist verboten.
- **Kein `any`**, TypeScript strict ist aktiviert.
- **UI deutsch**, Code / Bezeichner englisch.
- **Tailwind** — wir haben einen Kaffee-Braun-Palette (`kaffee-50..900`) in `tailwind.config.ts`.

## Nächste sinnvolle Iterationen

Kurzfristig (v1):
- **Magic-Link-Auth** via Resend für Cross-Device-Wiederherstellung
- **E-Mail-Monatsabrechnung** (Resend Template)
- **Landing SEO-Content** (Pagespeed + Meta-Tags)
- **Admin-View** (Gruppe umbenennen, Mitglieder rausnehmen)

Mittelfristig:
- **Holzschild-Shop** (Stripe Checkout, Fulfillment via Laser-Lasertag)
- **Multi-Language** (Englisch zuerst — Erasmus-WGs)
- **B2B-Tier** für Büros (Abrechnung gegen Kostenstelle)

Langfristig:
- **Apple/Google Wallet Pass** mit QR (alternative zum Holzschild)
- **Bank-Transfer** statt PayPal (SEPA via Mollie/Stripe)

## Debugging-Tipps

- Realtime läuft nicht? → Supabase Dashboard → Database → Replication → `supabase_realtime` → Tabelle `events` muss aktiviert sein (Migration macht das, aber manche Selfhost-Setups brauchen Handarbeit).
- "Invalid session" Fehler? → `SESSION_SECRET` geändert → alte Cookies sind ungültig. Inkognito-Fenster hilft.
- RLS blockt Writes? → Writes müssen über Server-Actions mit `SUPABASE_SERVICE_ROLE_KEY` laufen, nicht über den Anon-Client.
