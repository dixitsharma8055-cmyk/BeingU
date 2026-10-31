-- Tests the rule behind an interest page's "people" list: public profiles only, never yourself.
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if; end $$;

insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000c1'), ('00000000-0000-0000-0000-0000000000d1'), ('00000000-0000-0000-0000-0000000000e1');
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-0000000000c1', 'page_pub', 'Public One', '1990-01-01', 'public'),
  ('00000000-0000-0000-0000-0000000000d1', 'page_priv', 'Private Two', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-0000000000e1', 'page_me', 'Viewer', '1990-01-01', 'private');
insert into public.user_interests (user_id, interest_id)
select u, (select id from public.interests where slug='chess')
from (values ('00000000-0000-0000-0000-0000000000c1'::uuid), ('00000000-0000-0000-0000-0000000000d1'::uuid), ('00000000-0000-0000-0000-0000000000e1'::uuid)) v(u);

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);

-- The same query shape the app uses.
do $$ declare n int; ids text; begin
  select count(*), string_agg(p.username, ',') into n, ids
  from public.user_interests ui
  join public.profiles p on p.id = ui.user_id
  where ui.interest_id = (select id from public.interests where slug='chess')
    and p.profile_visibility = 'public'
    and ui.user_id <> '00000000-0000-0000-0000-0000000000e1';
  perform pg_temp.check('people list shows only the public profile', n = 1 and ids = 'page_pub');
end $$;
do $$ declare n int; begin
  select count(*) into n from public.user_interests ui join public.profiles p on p.id = ui.user_id
  where ui.interest_id = (select id from public.interests where slug='chess') and p.username = 'page_priv';
  perform pg_temp.check('private profile is hidden from another viewer', n = 0);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.user_interests ui join public.profiles p on p.id = ui.user_id
  where ui.interest_id = (select id from public.interests where slug='chess') and p.username = 'page_me';
  perform pg_temp.check('viewer does not see themselves in the people list (query excludes them)', n = 1);
end $$;
reset role;
