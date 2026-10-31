# Applying BeingU migrations in the Supabase SQL Editor

Status: PREPARED, NOT APPLIED. Do not start until the founder has reviewed every file and explicitly approved execution.

Project: Mumbai (ap-south-1), project reference `valawiylhhxopubbkckz`.
Never paste a database password, connection string or service-role key into the SQL Editor's chat, the repository or this document.

## Which files, in which order

Use the files from branch `feature/safety-blocking-reporting` (identical to `feature/phase2-phone-auth` for 0001–0005; see note on 0001 below).

| Step | File | What it does | Changes data? |
|---|---|---|---|
| 0 | Pre-check query (below) | Read-only. Confirms the project is empty of BeingU tables | No |
| 1 | `supabase/migrations/0001_foundation.sql` | Tables, helper functions, 18+ trigger, RLS | Creates objects only |
| 2 | `supabase/seed.sql` | 28 states and 8 union territories | Inserts 36 rows (skips existing) |
| 3 | `supabase/migrations/0002_interest_library.sql` | 26 categories, 520 interests | Inserts rows (skips existing) |
| 4 | `supabase/migrations/0003_save_my_interests.sql` | `save_my_interests` function | Creates a function only |
| 5 | `supabase/migrations/0004_discover.sql` | `discover_people` function | Creates a function only |
| 6 | `supabase/migrations/0005_hide_date_of_birth.sql` | Removes table-wide read of profiles, grants columns except date of birth | Changes privileges only |
| 7 | `supabase/migrations/0006_safety.sql` | Safety tables, functions, notice counts; REPLACES the profile read rule | Creates objects; replaces one policy |

No step drops a table or column, truncates a table, or deletes or overwrites existing records.

Two statements to read carefully:
- Step 7 drops and recreates the profile read policy. From that moment, blocked and banned profiles are hidden. Run it last.
- The `delete` inside `save_my_interests` (step 4) only runs when a person saves interests, not when the file is applied.

## Step 0: pre-check (read-only)

Paste into a new query and run it:

```sql
select
  to_regclass('public.profiles') as profiles,
  to_regclass('public.interests') as interests,
  to_regclass('public.blocks') as blocks;
```

Expected on an empty project: three blank results (null). If any shows a name, stop and send me the output. Some objects already exist and the plan must change.

## How to run each step

1. Open the file on GitHub (branch `feature/safety-blocking-reporting`), copy its full contents.
2. In the SQL Editor, open a new query. Paste the contents.
3. Run it once. Read the result message. Send me any error text, copied exactly.
4. Do not run the next step until the current one has finished without error.

If a step fails, the editor may leave the transaction open. Run `rollback;` before anything else, then send me the error.

## Checks after each step

- After step 1: `select count(*) from information_schema.tables where table_schema='public';` should return 6 (states_uts, cities, interest_categories, interests, profiles, user_interests).
- After step 7: the same query should return 15.
- After step 2: `select count(*) from public.states_uts;` should return 36.
- After step 3: `select count(*) from public.interests where is_approved;` should return 520.
- After step 6: `select has_column_privilege('authenticated', 'public.profiles', 'date_of_birth', 'SELECT');` should return false.
- After step 7: `select count(*) from pg_policies where schemaname='public';` should return 21.

Send me each result. I will not ask you to run anything further until I have reviewed these.

## Note on 0001

On `main`, the policy name in `0001_foundation.sql` differs from the branch copy: `"interests: signed-in users may suggest a new interest (unapproved)"` on `main` versus `"interests: suggest unapproved interest"` on the branch. Use the branch copy, which is the version the tests ran against.

## Rehearsal

The full order was rehearsed locally on a fresh PostgreSQL 16 database with the Supabase stub, each file wrapped in its own transaction. All seven steps passed. Results: 36 states, 520 approved interests, 21 policies. A local rehearsal does not prove the Supabase project will behave the same way: Supabase has its own auth schema and may already contain objects.
