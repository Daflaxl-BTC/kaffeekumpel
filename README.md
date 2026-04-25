# ☕ Kaffeekumpel

Digitale Kaffeekasse für geteilte Kaffeemaschinen.
**QR-Code scannen → ein Tap → fertig.** Kein Account, kein Login.

## Was es macht

- **WG / Büro / Coworking-Crew** hängt ein Holzschild mit QR-Code neben die Kaffeemaschine.
- Jeder scannt einmal, trägt seinen Namen ein, fertig — ab da: ein Tap pro Kaffee.
- Einkauf (Bohnen, Milch, Filter …) kann jeder eintragen, wird automatisch verrechnet.
- **Reinigungsrotation** zeigt wer dran ist.
- **Monatliche Abrechnung** berechnet minimale Überweisungen — ein Klick öffnet PayPal.me vom Gläubiger.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **Supabase** (Postgres + Realtime, EU-Frankfurt)
- **Tailwind CSS**
- **TypeScript strict**
- **Vercel** (Deployment, Free-Tier)
- **PayPal.me Deep-Links** (keine Payment-Prozessor-Lizenz nötig)

## Schnellstart

Siehe [SETUP.md](./SETUP.md) — von `npm install` bis zum laufenden Dev-Server in ca. 10 Minuten.

```bash
npm install
cp .env.example .env.local
# -> service_role-Key und SESSION_SECRET ergänzen
npm run dev
```

## Dokumentation

- [SETUP.md](./SETUP.md) — Schritt-für-Schritt Setup-Guide
- [CLAUDE.md](./CLAUDE.md) — Arbeitsleitfaden & Architektur-Entscheidungen (für Claude bzw. weitere Entwickler)
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Tiefere Entwickler-Doku, Happy-Path-Test

## Supabase-Projekt

Region: `eu-central-1` (Frankfurt). URL und Projekt-Referenz in der lokalen `.env.local` (siehe `.env.example`).

Schema und RLS sind bereits eingespielt.

## Lizenz

Proprietär / intern. Fragen: Felix Bredl — felix.bredl@gmail.com
