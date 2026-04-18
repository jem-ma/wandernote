-- Wandernote schema
-- Paste into Supabase SQL editor and run.

-- =============== TABLES ===============

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','past')),
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  kind text not null default 'journal' check (kind in ('journal','tip','note')),
  title text,
  body text,
  color text,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inspiration (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  note text,
  link text,
  color text,
  height int default 180,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- trip detail columns (safe to re-run)
alter table trips add column if not exists start_point text default 'home';
alter table trips add column if not exists start_date date default current_date;
alter table trips add column if not exists end_point text;
alter table trips add column if not exists end_date date;
alter table trips add column if not exists start_lat double precision;
alter table trips add column if not exists start_lng double precision;
alter table trips add column if not exists end_lat double precision;
alter table trips add column if not exists end_lng double precision;

create index if not exists entries_user_trip_idx on entries(user_id, trip_id, created_at desc);
create index if not exists inspiration_user_idx on inspiration(user_id, created_at desc);
create index if not exists trips_user_status_idx on trips(user_id, status);

-- =============== RLS ===============

alter table trips enable row level security;
alter table entries enable row level security;
alter table inspiration enable row level security;

drop policy if exists "trips: owner full access" on trips;
create policy "trips: owner full access" on trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries: owner full access" on entries;
create policy "entries: owner full access" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inspiration: owner full access" on inspiration;
create policy "inspiration: owner full access" on inspiration
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
