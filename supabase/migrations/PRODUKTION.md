# Stand der Migrationen in Produktion (Projekt `kaffeekumpel`, eu-central-1)

Abgefragt am 15.11.2026 über `supabase_migrations.schema_migrations`. Produktion ist weiter als dieses Verzeichnis: Die Audit-Migrationen vom 19.04.2026 wurden direkt eingespielt und fehlen hier.

| Version | Name | im Repo |
|---|---|---|
| 20260416215357 | initial_schema | als 20260416120000 |
| 20260416215423 | rls_policies | als 20260416120100 |
| 20260419004034 | invite_events_telemetry | fehlt |
| 20260419120549 | security_audit_tighten_public_reads | fehlt |
| 20260419120649 | security_audit_fix_security_definer_views | fehlt |
| 20260419120726 | security_audit_fix_function_search_path | fehlt |
| 20260419120815 | security_audit_add_missing_fk_indexes | fehlt |
| 20260419120901 | security_audit_document_deny_by_default | fehlt |
| 20260419131538 | security_audit_explicit_deny_policies | fehlt |
| 20260419151926 | security_audit_events_jwt_scoped | als 20260419090000 |
| 20260419152521 | events_policy_rls_initplan_fix | als 20260419091000 |
| 20261115201429 | members_deny_client_reads | als 20261115190000 |

Eingespielt am 15.11.2026 und geprüft: anon und authenticated haben kein SELECT mehr auf `members`, ein REST-Aufruf mit dem öffentlichen Schlüssel endet mit 42501 „permission denied“, der Security-Advisor meldet nichts, Vercel zeigt keine Laufzeitfehler. Server und Realtime sind nicht betroffen (service_role bzw. JWT-Claims auf `events`).

Offen: die fehlenden Dateien aus Produktion ins Repo holen (`supabase link`, dann `supabase migration fetch`), damit ein frisches Setup denselben Stand erreicht. Bis dahin ist Produktion die Quelle der Wahrheit.

Außerdem: `invite_events` verspricht laut Tabellenkommentar 90 Tage Aufbewahrung per pg_cron. Einen solchen Job gibt es nicht, pg_cron ist nicht aktiv. Die Tabelle ist leer, der Code schreibt nicht hinein. Wird die Telemetrie eingeschaltet, braucht sie vorher den Löschjob und einen Absatz in der Datenschutzerklärung.
