-- BeingU — Migration 0005: stop signed-in users reading anyone's date of birth (NOT YET APPLIED)
-- Row Level Security lets people read public profile rows, which would include date_of_birth.
-- Supabase grants table-wide read access by default, and a column-only revoke cannot undo that.
-- So: remove table-wide read, then grant back only the columns the app needs.
-- The 18+ check is a trigger that runs as the table owner, so it is unaffected.
-- Writes are unchanged: the user can still insert and update their own row through the policies.

revoke select on public.profiles from authenticated, anon;
grant select (
  id, username, display_name, bio, state_uts_id, city_id,
  location_visibility, profile_visibility, onboarding_completed, created_at, updated_at
) on public.profiles to authenticated;
