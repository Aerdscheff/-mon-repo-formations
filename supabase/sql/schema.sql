-- Database schema for Äerdschëff formations app
-- This schema defines profiles, progress and runs tables
-- with appropriate row level security policies.

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique check (length(handle) between 3 and 24),
  display_name text,
  avatar_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- PROGRESS (aggregates + role map)
create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  xp_total int not null default 0,
  level int not null default 1,
  tier text not null default 'debutant',
  job text,
  specialty text,
  updated_at timestamptz default now()
);

-- RUNS (session history)
create table if not exists public.runs (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  pack text not null,
  difficulty text not null,
  correct int not null default 0,
  wrong int not null default 0,
  streak_max int not null default 0,
  xp_earned int not null default 0,
  created_at timestamptz default now()
);

create index if not exists runs_pack_idx on public.runs (pack, created_at desc);
create index if not exists runs_user_idx on public.runs (user_id, created_at desc);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.runs enable row level security;

create policy "profiles readable (public names)" on public.profiles for select using (true);
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = id)
  using (auth.uid() = id);

create policy "progress self read" on public.progress
  for select using (auth.uid() = user_id);
create policy "progress self upsert" on public.progress
  for insert with check (auth.uid() = user_id)
  using (auth.uid() = user_id);

create policy "runs self read" on public.runs
  for select using (auth.uid() = user_id);
create policy "runs self insert" on public.runs
  for insert with check (auth.uid() = user_id);
