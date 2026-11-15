# Archiv: Arbeitszweige bis 15.11.2026

Aufräumrunde der Automatismenflotte. **Kein Zweig wurde gelöscht.** Jeder Zweig bleibt unter seinem Namen auf GitHub erreichbar; überholte Pull Requests wurden mit Begründung geschlossen und lassen sich jederzeit wieder öffnen.

Ausgangslage: Der Kaffeekumpel-Agent (GitHub Actions, `felix-ventures-automation`) hat zwischen Juli und November 2026 acht Pull Requests geöffnet, sieben davon für denselben `/new`-Fehler, der in Produktion längst behoben war. Ursache: keine Rückkopplung zu offenen PRs und kein Abgleich mit den Produktionsdaten vor jeder Arbeit.

Stand der Prüfung: main `2d30f2c`, 27 Zweige.

| Stand | Zweig | Commit | PR | Letzte Änderung | Bewertung |
|---|---|---|---|---|---|
| 2026-04-18 | `claude/new-session-6Pde2` | `4274c7c` | #4 (closed) | Surface server-side errors instead of generic "Application error" | Überholt: Fehlerseiten kommen mit der Übernahme von #8. |
| 2026-04-19 | `claude/determined-dhawan-6a681f` | `dddd2c0` | #3 (gemergt) | Debug: Prod-Env-Var-Diagnose + Error-Boundary für /new | Bereits in main enthalten. |
| 2026-04-19 | `claude/eager-spence-884b55` | `2ae8fc1` | #2 (gemergt) | M3: Realtime-Events auf JWT-gescopte RLS umstellen | Bereits in main enthalten. |
| 2026-04-19 | `claude/thirsty-wing-3aabb0` | `c5dcbfa` | #1 (gemergt) | PDF-Monatsrückblick mit personalisierten Claude-Kommentaren | Bereits in main enthalten. |
| 2026-04-20 | `claude/adapt-mobile-layout-1QRky` | `30b2dbd` | – | Mobile-Layout: Smartphone-Größen (~375px) optimieren | Weitgehend überholt durch spätere Design-Runde (#14). Einzelne Abstände ggf. nachziehen. |
| 2026-04-20 | `claude/add-qr-code-login-kpSbm` | `29aa5d6` | – | Login per QR-Scan oder 6-stelligem Code auf Landing | Bereits in main enthalten. |
| 2026-04-20 | `claude/fix-monthly-overview-SzgCn` | `b152c7a` | – | diag(realtime): console-warn beim Token-Fetch- und Subscribe-Fehler | Überholt: serverExternalPackages auf main; Diagnose-Logs nicht mehr nötig. |
| 2026-04-20 | `claude/jolly-visvesvaraya-687cb3` | `4e79647` | #7 (closed) | Einkauf-Form: Mobile-Overflow fixen | Überholt: als #11 auf main behoben. |
| 2026-04-20 | `claude/musing-bhabha-be3c5b` | `f49f762` | – | Profil: Speichern-Button mit Spinner + grüner Haken-Animation | Überholt: Speichern-Feedback im Profil ist auf main. |
| 2026-04-20 | `claude/serene-zhukovsky-3c2227` | `495008e` | – | feat(landing): add cartoon coffee-machine illustrations with wooden QR sign | **Prüfen.** Illustrationen Kaffeemaschine mit Holzschild-QR für die Landingpage. |
| 2026-04-20 | `claude/trusting-goodall-c6e65f` | `4978dc2` | #6 (gemergt), #5 (gemergt) | QR-Scanner: jsQR statt BarcodeDetector — funktioniert auf iOS | Überholt: als #5/#6 gemergt. |
| 2026-04-23 | `claude/frosty-snyder-0f733d` | `6481259` | #8 (open) | Launch-Readiness: Legal, Rate-Limit, Admin-UI, Magic-Link, Mail-Versand | **Übernehmen.** Impressum, Datenschutz, Fehlerseiten, Rate-Limit, Admin-Ansicht, Magic-Link. Rechtsseiten fehlen auf main; wird portiert. |
| 2026-04-27 | `claude/fix-mobile-table-width-627oD` | `b36fa0a` | #11 (gemergt) | fix(purchase-form): Mobil-Layout entzerren — Eintragen-Button bricht nicht mehr | Bereits in main enthalten. |
| 2026-04-27 | `claude/fix-qr-code-redirect-92LCl` | `82ca05e` | #10 (gemergt) | fix(recap): PDF-QR und Footer-URL auf kaffeekumpel.eu festziehen | Überholt: als #10 gemergt. |
| 2026-04-27 | `claude/fix-review-generation-7KLBD` | `1820a3c` | #9 (gemergt) | fix(recap): mark chromium/puppeteer as serverExternalPackages | Bereits in main enthalten. |
| 2026-05-10 | `feature/paypal-detail-modal` | `4848c32` | #12 (open) | feat(settlement): pay-out modal with PayPal deep links per member | **Übernehmen.** Auszahlungs-Dialog mit PayPal-Links je Mitglied, inkl. Tests. |
| 2026-05-14 | `claude/keen-bose-8bf0fa` | `e0dee09` | #13 (open) | fix(recap): ship chromium libs via outputFileTracingIncludes + harden route | **Prüfen.** Härtung des PDF-Rückblicks (Guard + Tests). Hängt an der Entscheidung zur Anthropic-Nutzung (Datenstandort). |
| 2026-05-16 | `claude/magical-rosalind-5f5244` | `b22342c` | #14 (gemergt) | feat(design): Farbsprache vereinheitlichen + Mikro-Interaktionen für klares Feedback | Bereits in main enthalten. |
| 2026-07-04 | `chore/autonomous-agents` | `54aafd7` | #15 (closed) | chore: add PR-only autonomous agents (feature, security) | Abgelöst durch die neue Agentenflotte. |
| 2026-07-22 | `agent/kaffeekumpel-agent/ux/2026-07-22-0plexn` | `8ea016b` | #16 (closed) | fix(api): resolve /new endpoint 500 error with idempotent group creation + error boundary | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-07-23 | `agent/kaffeekumpel-agent/website-critique/2026-07-23-9u2hvs` | `472bcaa` | #17 (closed) | fix: Serialize errors in createGroup server action — resolve /new 500 blocker | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-07-29 | `agent/kaffeekumpel-agent/ux/2026-07-29-hi1cp1` | `736512e` | #18 (closed) | feat: error boundary + retry logic für /new mit exponentialem Backoff | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-08-19 | `agent/kaffeekumpel-agent/ux/2026-08-19-u4805c` | `3db6390` | #19 (closed) | fix(app): add error boundary and proper 500 page for /new route | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-08-26 | `agent/kaffeekumpel-agent/ux/2026-08-26-zovzjt` | `075e097` | #20 (closed) | fix: Improve error handling on /new page (500 → user-friendly error) | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-10-14 | `agent/kaffeekumpel-agent/ux/2026-10-14-dm2ec1` | `e3e3e60` | #21 (closed) | feat: add loading skeletons to group page for better perceived performance | Überholt: main hat eigene Ladeskelette (f31435c). |
| 2026-10-21 | `agent/kaffeekumpel-agent/ux/2026-10-21-c9mec7` | `315c58b` | #22 (closed) | fix: resolve /new endpoint 500 error and improve group creation error handling | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |
| 2026-11-05 | `agent/kaffeekumpel-agent/ux/2026-11-05-51tms2` | `cfc4bba` | #23 (closed) | fix: Prod-Bug /new (500er) – Slug-Generierung mit Retry + Error-Boundary | Überholt: einer von sieben Anläufen auf den längst behobenen /new-Fehler. |

Zusätzlich: `archiv/probe` (`c5dcbfa`), technischer Probezweig dieser Aufräumrunde, inhaltsgleich mit `claude/thirsty-wing-3aabb0`. Kann gelöscht werden, sobald Löschen freigegeben ist.

## Wiederherstellen

```bash
git fetch origin <zweig>
git switch -c <neuer-name> origin/<zweig>
```
