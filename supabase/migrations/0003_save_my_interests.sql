-- BeingU — Migration 0003: atomic, validated save of a user's interests (NOT YET APPLIED)
-- The app calls this one function, so the selection is saved all-or-nothing and the rules
-- are enforced on the server, not only in the app.

create or replace function public.save_my_interests(items jsonb)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  n int;
  distinct_n int;
  visible_n int;
begin
  if uid is null then
    raise exception 'You need to be signed in to save interests';
  end if;
  if jsonb_typeof(items) <> 'array' then
    raise exception 'Interests must be a list';
  end if;

  n := jsonb_array_length(items);
  -- Onboarding rule: enough to find people, not so many that it overwhelms.
  if n < 3 or n > 20 then
    raise exception 'Choose between 3 and 20 interests';
  end if;

  -- A missing or hidden interest arrives as a null id; reject it explicitly.
  if exists (select 1 from jsonb_array_elements(items) as x where x->>'interest_id' is null) then
    raise exception 'One or more interests are not available';
  end if;

  select count(distinct x->>'interest_id') into distinct_n
  from jsonb_array_elements(items) as x;
  if distinct_n <> n then
    raise exception 'Each interest can only be chosen once';
  end if;

  -- Every chosen interest must be approved, or created by this user (their own custom interest).
  select count(*) into visible_n
  from public.interests i
  where i.id in (select (x->>'interest_id')::uuid from jsonb_array_elements(items) as x)
    and (i.is_approved or i.created_by = uid);
  if visible_n <> n then
    raise exception 'One or more interests are not available';
  end if;

  delete from public.user_interests ui
  where ui.user_id = uid
    and ui.interest_id not in (select (x->>'interest_id')::uuid from jsonb_array_elements(items) as x);

  insert into public.user_interests (user_id, interest_id, skill_level, is_favorite, wants_to_learn)
  select
    uid,
    (x->>'interest_id')::uuid,
    coalesce(x->>'skill_level', 'beginner'),
    coalesce((x->>'is_favorite')::boolean, false),
    coalesce((x->>'wants_to_learn')::boolean, false)
  from jsonb_array_elements(items) as x
  on conflict (user_id, interest_id) do update
    set skill_level = excluded.skill_level,
        is_favorite = excluded.is_favorite,
        wants_to_learn = excluded.wants_to_learn;

  return n;
end;
$$;

revoke all on function public.save_my_interests(jsonb) from public, anon;
grant execute on function public.save_my_interests(jsonb) to authenticated;
