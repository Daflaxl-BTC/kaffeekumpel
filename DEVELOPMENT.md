# DEVELOPMENT.md — Kaffeekumpel Entwickler-Doku

## Verzeichnisstruktur

```
kaffeekumpel/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root-Layout mit Toaster
│   ├── globals.css             # Tailwind + Kaffee-Base
│   ├── page.tsx                # Landing
│   ├── new/
│   │   ├── page.tsx            # Gruppe anlegen (Form)
│   │   └── actions.ts          # Server Action: createGroup
│   ├── g/[slug]/
│   │   ├── page.tsx            # Haupt-Gruppenansicht
│   │   ├── actions.ts          # tapEvent, addPurchase, joinGroup
│   │   ├── join/
│   │   │   ├── page.tsx
│   │   │   └── join-form.tsx   # "Ich bin X" / "Ich bin neu"
│   │   ├── settlement/
│   │   │   ├── page.tsx
│   │   │   ├── actions.ts      # finalizeSettlement, markDebtAsPaid
│   │   │   └── finalize-button.tsx
│   │   └── profile/
│   │       └── page.tsx
│   └── api/qr/[slug]/
│       └── route.ts            # QR-Code PNG/SVG
├── components/
│   ├── event-buttons.tsx       # 4 große Tap-Buttons + QR-Download
│   ├── purchase-form.tsx
│   ├── event-feed.tsx
│   ├── member-balance.tsx
│   ├── cleaning-banner.tsx
│   ├── live-group-view.tsx     # Realtime-Wrapper
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
├── hooks/
│   └── use-realtime-events.ts
├── lib/
│   ├── slug.ts                 # Crockford-Base32
│   ├── utils.ts                # cn(), formatEuro(), relativeTimeDE()
│   ├── cleaning.ts             # computeCleaningStatus()
│   ├── settlement/
│   │   ├── calculate.ts        # balances + greedy minimizer
│   │   └── paypal.ts           # paypal.me Deep-Link
│   ├── auth/
│   │   └── session.ts          # JWT ± HttpOnly-Cookie
│   └── supabase/
│       ├── server.ts           # service_role-Client (RSC + Actions)
│       └── client.ts           # anon-Client (Browser, nur Realtime)
├── supabase/migrations/
│   ├── 20260416120000_initial_schema.sql
│   └── 20260416120100_rls_policies.sql
├── tests/
│   ├── settlement.test.ts
│   ├── cleaning.test.ts
│   ├── paypal.test.ts
│   └── slug.test.ts
├── middleware.ts               # Auth-Guard für /g/[slug]*
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md                   # Architektur-Leitfaden
├── SETUP.md                    # 10-Min-Setup
└── DEVELOPMENT.md              # diese Datei
```

## Daten-Flow (typischer Tap)

1. User klickt **"Kaffee"** in `EventButtons` (Client).
2. Client-Komponente ruft Server Action `tapEvent({ slug, type: "coffee" })` auf.
3. Server Action liest Session-Cookie (`readSessionCookie`), validiert Slug.
4. Inserts `events` mit `service_role`-Client.
5. Postgres-Trigger aktualisiert `members.last_seen_at`.
6. `revalidatePath('/g/[slug]')` invalidiert den RSC-Cache.
7. **Realtime**: Browser-Subscription auf `events` feuert, `LiveGroupView` ruft `router.refresh()`, neuer Feed lädt sich still nach.

## Rechts­rutsch — warum kein Payment Processor?

Wir öffnen nur `paypal.me/<handle>/<betrag>EUR` Deep-Links. Wir **halten nie Geld**, wir **verarbeiten nie Zahlungen**. Damit:

- Keine BaFin-Registrierung
- Keine PSD2-Hürden
- Keine KYC/AML-Pflichten
- Keine Haftung für fehlgeschlagene Zahlungen

Der Preis dafür: Nutzer:innen brauchen auf beiden Seiten ein PayPal-Konto. Bei WGs/Büros ~100% Abdeckung, aber bei internationaleren Zielgruppen evtl. limitierend. v2-Kandidat: zusätzlich Wise/Revolut-Handles.

## Test-Strategie

- **Unit-Tests** (Vitest) auf die pure Business-Logik: `lib/slug`, `lib/cleaning`, `lib/settlement/*`, kein DB-Mocking nötig.
- **Keine E2E-Tests im MVP.** Lohnt sich erst bei echten Nutzer:innen. Playwright-Setup kann später hinzugefügt werden, aber der manuelle Happy-Path-Test (s. SETUP.md) deckt die kritischen Flows ab.
- **`npm run typecheck`** als CI-Gate bevor deployed wird.

## Performance-Pfade

- **RSC** liefert die Gruppenansicht HTML-streamig, erster Byte in ~100 ms.
- **Events-Feed** paginiert auf letzte 30, ältere nur on-demand.
- **QR-Route** cached `public, max-age=31536000, immutable` — 1 Abruf pro Slug lebenslang.
- **Realtime** nur auf `events.INSERT`, kein UPDATE/DELETE, also sehr günstig.

## Sicherheit

- Service-Role-Key **nur** in `lib/supabase/server.ts`, wird nie an den Client geschickt.
- Session-JWT ist `httpOnly` + `sameSite=lax` + `secure` in prod.
- Slug-Kollision wird beim Anlegen 5x retryed; bei 5 Fehlschlägen bricht der Flow — 32^6 ≈ 1 Mrd. macht das praktisch nie sichtbar.
- Middleware prüft Slug-Scope jedes Cookie (wer Gruppe A's Cookie klaut, kann nicht Gruppe B editieren).
- Input-Validierung via `zod` an jedem Server-Action-Entrypoint.

## Weiterarbeiten mit Claude

Der `CLAUDE.md` im Root ist der Einstieg für jede weitere Session. Er enthält: Vision, Kernentscheidungen, Datenmodell, Code-Layout, nächste Iterationen, Debugging-Tipps.

Claude sollte **nicht blind** neue Architektur-Muster einführen — unsere Konventionen (Server-Actions schreiben, RSC liest, Cents statt Float, Deutsch UI) sind explizit und bewährt.
