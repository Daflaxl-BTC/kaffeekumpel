-- Kaffeekumpel — RLS Policies
-- Pattern: Schreiben nur über Server-Actions mit service_role-Key.
-- Lesen ist public (wer den Slug kennt, darf sehen).

alter table public.groups      enable row level security;
alter table public.members     enable row level security;
alter table public.products    enable row level security;
alter table public.events      enable row level security;
alter table public.settlements enable row level security;
alter table public.debts       enable row level security;

create policy "public read groups"      on public.groups      for select to anon, authenticated using (true);
create policy "public read members"     on public.members     for select to anon, authenticated using (true);
create policy "public read products"    on public.products    for select to anon, authenticated using (true);
create policy "public read events"      on public.events      for select to anon, authenticated using (true);
create policy "public read settlements" on public.settlements for select to anon, authenticated using (true);
create policy "public read debts"       on public.debts       for select to anon, authenticated using (true);

alter publication supabase_realtime add table public.events;
