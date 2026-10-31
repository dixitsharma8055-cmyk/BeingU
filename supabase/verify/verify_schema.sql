-- BeingU post-migration verification. READ-ONLY: it only SELECTs from catalogs and prints PASS/FAIL.
-- Safe to run in the Supabase SQL Editor after migrations 0001-0005 and the seed.
do $$
declare
  t text; n int; ok boolean; cnt int;
  expected_tables text[] := array['states_uts','cities','interest_categories','interests','profiles','user_interests'];
  p text;
  fails int := 0;
  procedure_check boolean;
  procedure text;
begin
  -- 1. Tables exist with RLS enabled.
  foreach t in array expected_tables loop
    select relrowsecurity into ok from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relname = t;
    if ok is true then raise notice 'PASS: RLS enabled on public.%', t;
    else raise notice 'FAIL: RLS missing or table absent: public.%', t; fails := fails + 1; end if;
  end loop;

  -- 2. Each table has at least one policy.
  foreach t in array expected_tables loop
    select count(*) into n from pg_policies where schemaname = 'public' and tablename = t;
    if n > 0 then raise notice 'PASS: % policies on public.% (%)', n, t, n;
    else raise notice 'FAIL: no policies on public.%', t; fails := fails + 1; end if;
  end loop;

  -- 3. Adult check trigger exists.
  select count(*) into n from pg_trigger where tgname = 'profiles_adult_check' and not tgisinternal;
  if n = 1 then raise notice 'PASS: 18+ trigger present';
  else raise notice 'FAIL: 18+ trigger missing'; fails := fails + 1; end if;

  -- 4. Functions exist and run with the caller's rights (security invoker).
  foreach procedure in array array['save_my_interests','discover_people'] loop
    select count(*) into n from pg_proc pr join pg_namespace ns on ns.oid = pr.pronamespace
      where ns.nspname = 'public' and pr.proname = procedure and not pr.prosecdef;
    if n >= 1 then raise notice 'PASS: public.% exists (security invoker)', procedure;
    else raise notice 'FAIL: public.% missing or not security invoker', procedure; fails := fails + 1; end if;
  end loop;

  -- 5. Date of birth is not readable by signed-in users.
  select has_column_privilege('authenticated', 'public.profiles', 'date_of_birth', 'SELECT') into ok;
  if ok is false then raise notice 'PASS: authenticated cannot read profiles.date_of_birth';
  else raise notice 'FAIL: authenticated CAN read profiles.date_of_birth'; fails := fails + 1; end if;

  -- 6. Seed data present.
  select count(*) into cnt from public.states_uts;
  if cnt = 36 then raise notice 'PASS: 36 states and union territories';
  else raise notice 'FAIL: expected 36 states/UTs, found %', cnt; fails := fails + 1; end if;
  select count(*) into cnt from public.interest_categories;
  if cnt = 26 then raise notice 'PASS: 26 interest categories';
  else raise notice 'FAIL: expected 26 categories, found %', cnt; fails := fails + 1; end if;
  select count(*) into cnt from public.interests where is_approved;
  if cnt >= 500 then raise notice 'PASS: % approved interests (need at least 500)', cnt;
  else raise notice 'FAIL: only % approved interests', cnt; fails := fails + 1; end if;

  -- 7. Indexes that the queries rely on.
  select count(*) into n from pg_indexes where schemaname = 'public'
    and indexname in ('cities_state_idx','interests_category_idx','user_interests_interest_idx');
  if n = 3 then raise notice 'PASS: query indexes present';
  else raise notice 'FAIL: % of 3 query indexes present', n; fails := fails + 1; end if;

  if fails = 0 then raise notice 'RESULT: ALL CHECKS PASSED';
  else raise notice 'RESULT: % CHECK(S) FAILED', fails; end if;
end $$;
