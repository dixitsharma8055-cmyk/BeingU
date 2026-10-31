-- Looking up another person's profile by username: public visible, private looks the same as missing.
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if; end $$;

insert into auth.users (id) values ('00000000-0000-0000-0000-000000009001'), ('00000000-0000-0000-0000-000000009002'), ('00000000-0000-0000-0000-000000009003');
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-000000009001', 'up_viewer', 'Viewer', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-000000009002', 'up_public', 'Open Person', '1990-01-01', 'public'),
  ('00000000-0000-0000-0000-000000009003', 'up_private', 'Closed Person', '1990-01-01', 'private');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009001', false);
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'up_public';
  perform pg_temp.check('a public profile can be found by username', n = 1);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'up_private';
  perform pg_temp.check('a private profile cannot be found by username', n = 0);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'up_nobody';
  perform pg_temp.check('a missing profile looks the same as a private one', n = 0);
end $$;
reset role;
