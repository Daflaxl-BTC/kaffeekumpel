-- Kaffeekumpel — Security-Audit 2026-04-19, M3
-- Bisherige Policy "public read events" (using(true) für anon+authenticated)
-- erlaubte jedem, den Realtime-Feed fremder Gruppen mitzulesen, wenn er die
-- group_id erraten oder abgreifen konnte. Ersatz:
--
--   1. anon hat keinen SELECT-Zugriff mehr auf events (Default-Deny)
--   2. authenticated sieht nur events für group_ids, die im JWT stehen
--      (Claim: app_metadata.group_ids, gesetzt durch /api/realtime-token)
--
-- RSC-Reads laufen weiter über den Service-Role-Key und bypassen RLS — keine
-- App-Änderung dort nötig. Nur der Browser-Realtime-Channel ist jetzt scoped.

drop policy if exists "public read events" on public.events;

create policy "events scoped by jwt group_ids"
  on public.events
  for select
  to authenticated
  using (
    group_id::text = any(
      array(
        select jsonb_array_elements_text(
          coalesce(
            auth.jwt() -> 'app_metadata' -> 'group_ids',
            '[]'::jsonb
          )
        )
      )
    )
  );
