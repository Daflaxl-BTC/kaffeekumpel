-- Kaffeekumpel — initial schema
-- (Bereits auf Supabase-Projekt ahhpzhgnqgggqnawiojk eingespielt via MCP.)
-- Diese Datei ist die Kopie zum Versionieren / Neu-Deployen.

create extension if not exists "pgcrypto";

create table public.groups (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null check (length(name) between 1 and 80),
  coffee_price_cents integer not null default 30 check (coffee_price_cents >= 0),
  currency    text        not null default 'EUR' check (currency in ('EUR','CHF','USD','GBP')),
  cleaning_interval_days integer not null default 7 check (cleaning_interval_days > 0),
  created_at  timestamptz not null default now()
);
create index groups_slug_idx on public.groups (slug);

create table public.members (
  id              uuid        primary key default gen_random_uuid(),
  group_id        uuid        not null references public.groups(id) on delete cascade,
  name            text        not null check (length(name) between 1 and 50),
  email           text,
  paypal_handle   text,
  role            text        not null default 'member' check (role in ('admin','member')),
  active          boolean     not null default true,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  unique (group_id, name)
);
create index members_group_idx on public.members (group_id);

create table public.products (
  id         uuid        primary key default gen_random_uuid(),
  group_id   uuid        not null references public.groups(id) on delete cascade,
  name       text        not null check (length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (group_id, name)
);
create index products_group_idx on public.products (group_id);

create type public.event_type as enum ('coffee','cleaning','refill','purchase');

create table public.events (
  id           uuid        primary key default gen_random_uuid(),
  group_id     uuid        not null references public.groups(id) on delete cascade,
  member_id    uuid        not null references public.members(id) on delete cascade,
  type         public.event_type not null,
  product_id   uuid        references public.products(id) on delete set null,
  cost_cents   integer     check (cost_cents is null or cost_cents >= 0),
  note         text,
  created_at   timestamptz not null default now()
);
create index events_group_time_idx on public.events (group_id, created_at desc);
create index events_member_idx on public.events (member_id);

create table public.settlements (
  id                uuid        primary key default gen_random_uuid(),
  group_id          uuid        not null references public.groups(id) on delete cascade,
  finalized_at      timestamptz not null default now(),
  finalized_by_id   uuid        references public.members(id) on delete set null,
  covered_from      timestamptz not null,
  covered_to        timestamptz not null,
  check (covered_to > covered_from)
);
create index settlements_group_idx on public.settlements (group_id, finalized_at desc);

create table public.debts (
  id              uuid        primary key default gen_random_uuid(),
  settlement_id   uuid        not null references public.settlements(id) on delete cascade,
  from_member_id  uuid        not null references public.members(id),
  to_member_id    uuid        not null references public.members(id),
  amount_cents    integer     not null check (amount_cents > 0),
  status          text        not null default 'open' check (status in ('open','paid')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  check (from_member_id <> to_member_id)
);
create index debts_settlement_idx on public.debts (settlement_id);
create index debts_from_idx on public.debts (from_member_id);

create or replace function public.touch_member_last_seen()
returns trigger language plpgsql as $$
begin
  update public.members set last_seen_at = now() where id = new.member_id;
  return new;
end $$;

create trigger events_touch_member
after insert on public.events
for each row execute function public.touch_member_last_seen();
