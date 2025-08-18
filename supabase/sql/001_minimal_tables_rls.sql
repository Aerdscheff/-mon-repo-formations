-- Minimal schema for runs, run_traces, progress with RLS and helpful indexes
-- Requires Postgres 14+ (Supabase default). Uses pgcrypto for gen_random_uuid().

-- Extensions
create extension if not exists pgcrypto;

-- progress: aggregate XP and user tier/level
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp_total integer not null default 0,
  level integer not null default 1,
  tier text not null default 'debutant',
  updated_at timestamptz not null default now()
);

-- runs: summary events (one per quiz summary ideally)
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack text not null,
  difficulty text not null,
  activity_id text,
  correct integer,
  wrong integer,
  streak_max integer,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now()
);

-- Optional traces for per-question events (non-credit)
create table if not exists public.run_traces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack text not null,
  activity_id text,
  type text,
  difficulty text,
  correct integer,
  wrong integer,
  streak_max integer,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_runs_user_created_at on public.runs (user_id, created_at desc);
create index if not exists idx_runs_activity on public.runs (activity_id);
-- Enforce idempotency for summary events (activity_id begins with 'summary:')
create unique index if not exists ux_runs_user_summary_activity on public.runs (user_id, activity_id) where activity_id like 'summary:%';

create index if not exists idx_run_traces_user_created_at on public.run_traces (user_id, created_at desc);

-- Enable RLS
alter table public.progress enable row level security;
alter table public.runs enable row level security;
alter table public.run_traces enable row level security;

-- Policies: progress (self read/update/insert)
create policy if not exists "progress_select_self" on public.progress
  for select using (auth.uid() = user_id);
create policy if not exists "progress_insert_self" on public.progress
  for insert with check (auth.uid() = user_id);
create policy if not exists "progress_update_self" on public.progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies: runs (self select/insert)
create policy if not exists "runs_select_self" on public.runs
  for select using (auth.uid() = user_id);
create policy if not exists "runs_insert_self" on public.runs
  for insert with check (auth.uid() = user_id);

-- Policies: run_traces (self select/insert)
create policy if not exists "run_traces_select_self" on public.run_traces
  for select using (auth.uid() = user_id);
create policy if not exists "run_traces_insert_self" on public.run_traces
  for insert with check (auth.uid() = user_id);

-- Grants to roles (Supabase predefined roles)
grant select, insert, update on public.progress to authenticated;
grant select, insert on public.runs to authenticated;
grant select, insert on public.run_traces to authenticated;
