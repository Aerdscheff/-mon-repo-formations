-- Leaderboards (7j / 30j / all-time)
-- NOTE: RLS on runs prevents global reads for normal users. We expose a SECURITY DEFINER
-- function `get_leaderboard(period)` to allow aggregated read without exposing raw rows.

-- Optional minimal profiles table (if your project doesn't have one yet)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text,
  full_name text,
  updated_at timestamptz default now()
);

-- Views (readable by service role / security definer function)
create or replace view public.leaderboard_all_time as
select r.user_id,
       coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8)) as name,
       sum(r.xp_earned)::bigint as xp,
       count(*)::int as runs,
       max(r.created_at) as last_run
from public.runs r
left join public.profiles p on p.id = r.user_id
group by r.user_id, coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8))
order by xp desc;

create or replace view public.leaderboard_30d as
select r.user_id,
       coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8)) as name,
       sum(r.xp_earned)::bigint as xp,
       count(*)::int as runs,
       max(r.created_at) as last_run
from public.runs r
left join public.profiles p on p.id = r.user_id
where r.created_at >= now() - interval '30 days'
group by r.user_id, coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8))
order by xp desc;

create or replace view public.leaderboard_7d as
select r.user_id,
       coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8)) as name,
       sum(r.xp_earned)::bigint as xp,
       count(*)::int as runs,
       max(r.created_at) as last_run
from public.runs r
left join public.profiles p on p.id = r.user_id
where r.created_at >= now() - interval '7 days'
group by r.user_id, coalesce(p.display_name, p.username, p.full_name, left(r.user_id::text, 8))
order by xp desc;

-- SECURITY DEFINER function to expose aggregated leaderboards without raw runs
create or replace function public.get_leaderboard(period text default 'all')
returns table(user_id uuid, name text, xp bigint, runs int, last_run timestamptz)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select * from (
    select * from public.leaderboard_7d where lower($1) in ('7d','7','week')
    union all
    select * from public.leaderboard_30d where lower($1) in ('30d','30','month')
    union all
    select * from public.leaderboard_all_time where lower($1) in ('all','all-time','global','*')
  ) t;
$$;

-- Ensure function owner is postgres (bypass RLS for aggregation)
alter function public.get_leaderboard(text) owner to postgres;

-- Grants
grant execute on function public.get_leaderboard(text) to anon, authenticated;
