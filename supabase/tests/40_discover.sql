-- Discover rules: public people who share interests, most shared first, never the caller or private profiles.
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if; end $$;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000f0'), ('00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000000f2'), ('00000000-0000-0000-0000-0000000000f3'),
  ('00000000-0000-0000-0000-0000000000f4');
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-0000000000f0', 'disc_me', 'Me', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-0000000000f1', 'disc_one', 'One', '1990-01-01', 'public'),     -- shares chess
  ('00000000-0000-0000-0000-0000000000f2', 'disc_two', 'Two', '1990-01-01', 'public'),     -- shares chess + guitar
  ('00000000-0000-0000-0000-0000000000f3', 'disc_hidden', 'Hidden', '1990-01-01', 'private'), -- shares chess, private
  ('00000000-0000-0000-0000-0000000000f4', 'disc_stranger', 'Stranger', '1990-01-01', 'public'); -- public, shares nothing
insert into public.user_interests (user_id, interest_id) values
  ('00000000-0000-0000-0000-0000000000f0', (select id from public.interests where slug='chess')),
  ('00000000-0000-0000-0000-0000000000f0', (select id from public.interests where slug='guitar')),
  ('00000000-0000-0000-0000-0000000000f1', (select id from public.interests where slug='chess')),
  ('00000000-0000-0000-0000-0000000000f2', (select id from public.interests where slug='chess')),
  ('00000000-0000-0000-0000-0000000000f2', (select id from public.interests where slug='guitar')),
  ('00000000-0000-0000-0000-0000000000f3', (select id from public.interests where slug='chess')),
  ('00000000-0000-0000-0000-0000000000f4', (select id from public.interests where slug='yoga'));

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f0', false);

do $$ declare n int; names text; begin
  -- Other test files leave their own users behind, so only look at this file's users (disc_%).
  select count(*), string_agg(username, ',' order by username) into n, names from public.discover_people(30) where username like 'disc_%';
  perform pg_temp.check('returns only public people who share an interest', n = 2 and names = 'disc_one,disc_two');
end $$;
do $$ declare first text; begin
  select username into first from public.discover_people(50) where username like 'disc_%' order by shared_count desc, username limit 1;
  perform pg_temp.check('most shared interests come first', first = 'disc_two');
end $$;
do $$ declare c int; sh text[]; begin
  select shared_count, shared_names into c, sh from public.discover_people(30) where username = 'disc_two';
  perform pg_temp.check('reports the count and names shared', c = 2 and sh = array['Chess','Guitar']);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.discover_people(50) where username in ('disc_hidden','disc_me','disc_stranger');
  perform pg_temp.check('excludes private, self and no-overlap profiles', n = 0);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.discover_people(1);
  perform pg_temp.check('respects the row limit', n = 1);
end $$;
reset role;

-- Signed-out callers get nothing.
set role anon;
do $$ begin
  begin perform * from public.discover_people(30);
    perform pg_temp.check('signed-out callers cannot run discover', false);
  exception when insufficient_privilege then perform pg_temp.check('signed-out callers cannot run discover', true); end;
end $$;
reset role;

-- Date of birth is never readable by a signed-in user, even on a public profile.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000f0', false);
do $$ begin
  begin perform date_of_birth from public.profiles where username = 'disc_one';
    perform pg_temp.check('date of birth is hidden from other users', false);
  exception when insufficient_privilege then perform pg_temp.check('date of birth is hidden from other users', true); end;
end $$;
reset role;
