-- Follow-up zu 20260419090000: auth.jwt() pro-Row-Evaluation vermeiden.
-- Advisor-Lint `auth_rls_initplan` meldet sonst WARN; (select auth.jwt())
-- wird von Postgres einmal pro Query evaluiert statt pro Zeile.
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

drop policy if exists "events scoped by jwt group_ids" on public.events;

create policy "events scoped by jwt group_ids"
  on public.events
  for select
  to authenticated
  using (
    group_id::text = any(
      array(
        select jsonb_array_elements_text(
          coalesce(
            (select auth.jwt()) -> 'app_metadata' -> 'group_ids',
            '[]'::jsonb
          )
        )
      )
    )
  );
