-- Tests for public.save_my_interests. Runs against the rebuilt test database.
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if; end $$;

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1'), ('00000000-0000-0000-0000-0000000000b1');
insert into public.profiles (id, username, display_name, date_of_birth) values
  ('00000000-0000-0000-0000-0000000000a1', 'int_a', 'Int A', '1995-01-01'),
  ('00000000-0000-0000-0000-0000000000b1', 'int_b', 'Int B', '1995-01-01');
-- User B's private custom interest (unapproved).
insert into public.interests (category_id, slug, name_en, is_approved, created_by)
select id, 'b-private-hobby', 'B Private', false, '00000000-0000-0000-0000-0000000000b1' from public.interest_categories where slug='other';

-- Helper: ids of three approved interests.
create temp table picks as select id, slug, row_number() over (order by slug) rn from public.interests where slug in ('chess','guitar','cricket','yoga') ;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);

do $$ declare n int; begin
  select public.save_my_interests(jsonb_build_array(
    jsonb_build_object('interest_id',(select id from public.interests where slug='chess'),'skill_level','advanced','is_favorite',true),
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar'),'skill_level','beginner','wants_to_learn',true),
    jsonb_build_object('interest_id',(select id from public.interests where slug='cricket'))
  )) into n;
  perform pg_temp.check('saves 3 interests', n = 3);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.user_interests where user_id='00000000-0000-0000-0000-0000000000a1' and skill_level='advanced' and is_favorite;
  perform pg_temp.check('stores skill level and favourite', n = 1);
end $$;
-- Re-saving with a different selection replaces it (chess removed, yoga added), with no leftovers.
do $$ declare n int; begin
  perform public.save_my_interests(jsonb_build_array(
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='cricket')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='yoga'))
  ));
  select count(*) into n from public.user_interests where user_id='00000000-0000-0000-0000-0000000000a1';
  perform pg_temp.check('re-save replaces selection (3 rows, no leftovers)', n = 3);
  select count(*) into n from public.user_interests where user_id='00000000-0000-0000-0000-0000000000a1' and interest_id=(select id from public.interests where slug='chess');
  perform pg_temp.check('removed interest is deleted', n = 0);
end $$;
do $$ begin
  begin perform public.save_my_interests(jsonb_build_array(jsonb_build_object('interest_id',(select id from public.interests where slug='guitar'))));
    perform pg_temp.check('rejects fewer than 3 interests', false);
  exception when others then perform pg_temp.check('rejects fewer than 3 interests', sqlerrm like '%between 3 and 20%'); end;
end $$;
do $$ declare arr jsonb := '[]'; i int; begin
  for i in 1..21 loop arr := arr || jsonb_build_array(jsonb_build_object('interest_id',(select id from public.interests order by slug offset i limit 1))); end loop;
  begin perform public.save_my_interests(arr);
    perform pg_temp.check('rejects more than 20 interests', false);
  exception when others then perform pg_temp.check('rejects more than 20 interests', sqlerrm like '%between 3 and 20%'); end;
end $$;
do $$ begin
  begin perform public.save_my_interests(jsonb_build_array(
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='cricket'))));
    perform pg_temp.check('rejects duplicate interests', false);
  exception when others then perform pg_temp.check('rejects duplicate interests', sqlerrm like '%only be chosen once%'); end;
end $$;
do $$ begin
  begin perform public.save_my_interests(jsonb_build_array(
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='cricket')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='b-private-hobby'))));
    perform pg_temp.check('cannot choose another user private interest', false);
  exception when others then perform pg_temp.check('cannot choose another user private interest', sqlerrm like '%not available%'); end;
end $$;
-- Failed save must not change existing rows (all-or-nothing).
do $$ declare n int; begin
  begin perform public.save_my_interests(jsonb_build_array(
    jsonb_build_object('interest_id',(select id from public.interests where slug='guitar')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='cricket')),
    jsonb_build_object('interest_id',(select id from public.interests where slug='b-private-hobby'))));
  exception when others then null; end;
  select count(*) into n from public.user_interests where user_id='00000000-0000-0000-0000-0000000000a1';
  perform pg_temp.check('failed save leaves previous selection untouched', n = 3);
end $$;
reset role;
-- Signed-out callers are refused.
set role anon;
do $$ begin
  begin perform public.save_my_interests('[]'::jsonb);
    perform pg_temp.check('signed-out caller cannot save', false);
  exception when others then perform pg_temp.check('signed-out caller cannot save', true); end;
end $$;
reset role;
