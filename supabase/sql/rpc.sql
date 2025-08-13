-- RPC definitions for leaderboard queries

-- All-time leaderboard
create or replace function public.leaderboard_all()
returns table (handle text, xp_total int) as $$
  select p.handle, pr.xp_total
  from public.profiles p
  join public.progress pr on pr.user_id = p.id
  where p.is_public = true
  order by pr.xp_total desc
  limit 100;
$$ language sql stable;

-- 30-day leaderboard
create or replace function public.leaderboard_30()
returns table (handle text, xp_total int) as $$
  select p.handle, sum(r.xp_earned) as xp_total
  from public.profiles p
  join public.runs r on r.user_id = p.id
  where r.created_at >= (now() - interval '30 days') and p.is_public = true
  group by p.handle
  order by xp_total desc
  limit 100;
$$ language sql stable;

-- 7-day leaderboard
create or replace function public.leaderboard_7()
returns table (handle text, xp_total int) as $$
  select p.handle, sum(r.xp_earned) as xp_total
  from public.profiles p
  join public.runs r on r.user_id = p.id
  where r.created_at >= (now() - interval '7 days') and p.is_public = true
  group by p.handle
  order by xp_total desc
  limit 100;
$$ language sql stable;
