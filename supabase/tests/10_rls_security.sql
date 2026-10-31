-- BeingU RLS and rule tests. Each check prints PASS or FAIL.
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin
  if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if;
end $$;

-- Two adult users (A, B) and one minor (M). Created as the superuser, which bypasses RLS.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'm@example.test');

-- Adult trigger (superuser): minor must be rejected.
do $$ begin
  begin
    insert into public.profiles (id, username, display_name, date_of_birth)
    values ('00000000-0000-0000-0000-00000000000c', 'minor_user', 'Minor', current_date - interval '10 years');
    perform pg_temp.check('database rejects a 10-year-old profile', false);
  exception when others then
    perform pg_temp.check('database rejects a 10-year-old profile', sqlerrm like '%18 and above%');
  end;
end $$;

-- Create adult profiles A (private) and B (public) as the superuser.
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-00000000000a', 'user_a', 'Asha', '1995-01-01', 'private'),
  ('00000000-0000-0000-0000-00000000000b', 'user_b', 'Bilal', '1992-06-15', 'public');

-- Act as user A.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);

do $$ declare n int; begin
  select count(*) into n from public.profiles where id = '00000000-0000-0000-0000-00000000000b';
  perform pg_temp.check('A can see public profile of B', n = 1);
end $$;

do $$ declare n int; begin
  select count(*) into n from public.profiles where id = '00000000-0000-0000-0000-00000000000a';
  perform pg_temp.check('A can see own private profile', n = 1);
end $$;

do $$ declare n int; begin
  update public.profiles set bio = 'hacked' where id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  perform pg_temp.check('A cannot edit B profile (0 rows changed)', n = 0);
end $$;

do $$ begin
  begin
    insert into public.profiles (id, username, display_name, date_of_birth)
    values ('00000000-0000-0000-0000-00000000000b', 'impostor', 'X', '1990-01-01');
    perform pg_temp.check('A cannot create a profile for B', false);
  exception when others then
    perform pg_temp.check('A cannot create a profile for B', true);
  end;
end $$;

do $$ declare n int; begin
  delete from public.profiles where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  perform pg_temp.check('no client delete on profiles (0 rows deleted)', n = 0);
end $$;

-- A saves an interest for self (positive check first, so the negative check below is meaningful).
insert into public.user_interests (user_id, interest_id, skill_level)
select '00000000-0000-0000-0000-00000000000a', id, 'beginner' from public.interests where slug = 'guitar';
do $$ declare n int; begin
  select count(*) into n from public.user_interests where user_id = '00000000-0000-0000-0000-00000000000a';
  perform pg_temp.check('A can save an interest for self', n = 1);
end $$;

-- A tries to add an interest for B. Setup guard: the interest must exist, or the test proves nothing.
do $$ declare n int; begin
  select count(*) into n from public.interests where slug = 'chess';
  if n <> 1 then raise exception 'setup: chess interest missing'; end if;
  begin
    insert into public.user_interests (user_id, interest_id)
    select '00000000-0000-0000-0000-00000000000b', id from public.interests where slug = 'chess';
    perform pg_temp.check('A cannot add interests for B', false);
  exception when others then
    perform pg_temp.check('A cannot add interests for B', true);
  end;
end $$;

-- A can suggest a custom (unapproved) interest for self.
insert into public.interests (category_id, slug, name_en, is_approved, created_by)
select id, 'my-custom-hobby', 'My Custom Hobby', false, '00000000-0000-0000-0000-00000000000a'
from public.interest_categories where slug = 'other';
do $$ begin
  begin
    insert into public.interests (category_id, slug, name_en, is_approved, created_by)
    select id, 'sneaky-approved', 'Sneaky', true, '00000000-0000-0000-0000-00000000000a'
    from public.interest_categories where slug = 'other';
    perform pg_temp.check('A cannot create an already-approved interest', false);
  exception when others then
    perform pg_temp.check('A cannot create an already-approved interest', true);
  end;
end $$;

-- Switch to user B.
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);

do $$ declare n int; begin
  select count(*) into n from public.interests where slug = 'my-custom-hobby';
  perform pg_temp.check('B cannot see A unapproved custom interest', n = 0);
end $$;

do $$ declare n int; begin
  select count(*) into n from public.user_interests where user_id = '00000000-0000-0000-0000-00000000000a';
  perform pg_temp.check('B cannot see A interests while A profile is private', n = 0);
end $$;

-- Make A public; now B can see A's interests.
reset role;
update public.profiles set profile_visibility = 'public' where id = '00000000-0000-0000-0000-00000000000a';
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ declare n int; begin
  select count(*) into n from public.user_interests where user_id = '00000000-0000-0000-0000-00000000000a';
  perform pg_temp.check('B can see A interests once A is public', n = 1);
end $$;

-- Anonymous (signed-out) users see no profiles.
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ declare n int; begin
  begin
    select count(*) into n from public.profiles;
    perform pg_temp.check('signed-out users see no profiles', n = 0);
  exception when others then
    perform pg_temp.check('signed-out users see no profiles (blocked)', true);
  end;
end $$;

reset role;
