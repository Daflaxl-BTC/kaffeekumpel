-- Kaffeekumpel · 2026-11-15 · Mitgliederdaten für Client-Rollen sperren
--
-- Bisher (seit 20260419120549, security_audit_tighten_public_reads) durfte jeder
-- mit dem öffentlichen anon-Schlüssel die Spalten id, group_id, name, role,
-- active, created_at und last_seen_at ALLER Mitglieder ALLER Gruppen lesen.
-- Der Browser braucht das nicht: Er nutzt den anon-Schlüssel nur für den
-- Realtime-Kanal auf public.events (JWT-gescopt). Alle übrigen Lesezugriffe
-- laufen serverseitig über service_role und umgehen RLS.
--
-- Hinweis: Produktion enthält zusätzlich die Audit-Migrationen vom 19.04.2026
-- (siehe supabase/migrations/PRODUKTION.md); dieses Repo führt sie bisher nicht.

drop policy if exists "public read members non-pii" on public.members;

-- Entzieht auch die Spaltenrechte aus dem Audit vom 19.04.2026.
revoke select on public.members from anon, authenticated;

create policy "deny all to client roles" on public.members
  for all to anon, authenticated
  using (false) with check (false);

comment on table public.members is
  'RLS: Client-Rollen gesperrt, Zugriff ausschließlich über service_role (Server). Seit 2026-11-15.';
