-- BeingU — Migration 0004: Discover (NOT YET APPLIED)
-- Returns public people who share at least one interest with the caller, most shared first.
-- Runs with the caller's own permissions (security invoker), so Row Level Security still applies:
-- private profiles and private interest rows are never returned.

create or replace function public.discover_people(max_rows int default 30)
returns table (
  user_id uuid,
  username text,
  display_name text,
  state_name text,
  shared_count int,
  shared_names text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with mine as (
    select ui.interest_id
    from public.user_interests ui
    where ui.user_id = (select auth.uid())
  ),
  candidates as (
    select ui.user_id, ui.interest_id
    from public.user_interests ui
    join public.profiles p on p.id = ui.user_id
    where ui.interest_id in (select interest_id from mine)
      and p.profile_visibility = 'public'
      and ui.user_id <> (select auth.uid())
  )
  select
    p.id,
    p.username,
    p.display_name,
    s.name,
    count(*)::int,
    array_agg(i.name_en order by i.name_en)
  from candidates c
  join public.profiles p on p.id = c.user_id
  join public.interests i on i.id = c.interest_id
  left join public.states_uts s on s.id = p.state_uts_id
  group by p.id, p.username, p.display_name, s.name
  order by count(*) desc, p.username
  limit greatest(1, least(max_rows, 50));
$$;

revoke all on function public.discover_people(int) from public, anon;
grant execute on function public.discover_people(int) to authenticated;
