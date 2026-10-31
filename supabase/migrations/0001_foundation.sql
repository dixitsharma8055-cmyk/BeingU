-- BeingU — Migration 0001: foundation schema (NOT YET APPLIED)
-- Target: one primary Supabase project hosted in Mumbai (ap-south-1). Nationwide, no city/state gating.
-- Safe to review: this file only CREATES objects. It contains no DROP or DELETE statements.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Locations: all Indian states and union territories, then cities/towns.
-- ---------------------------------------------------------------------------
create table public.states_uts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('state', 'union_territory')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  state_uts_id uuid not null references public.states_uts (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  is_town boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_uts_id, name)
);
create index cities_state_idx on public.cities (state_uts_id);

-- ---------------------------------------------------------------------------
-- Interest library
-- ---------------------------------------------------------------------------
create table public.interest_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_en text not null,
  name_hi text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.interest_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_en text not null,
  name_hi text,
  is_approved boolean not null default true, -- user-added interests start unapproved (moderation)
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interests_category_idx on public.interests (category_id);

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user). Exact home address is NEVER stored.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (bio is null or char_length(bio) <= 300),
  date_of_birth date not null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  state_uts_id uuid references public.states_uts (id) on delete set null,
  city_id uuid references public.cities (id) on delete set null,
  location_visibility text not null default 'hidden' check (location_visibility in ('hidden', 'state', 'city')),
  profile_visibility text not null default 'private' check (profile_visibility in ('public', 'private')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18+ rule enforced in the database, not only in the app.
create or replace function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth > (current_date - interval '18 years') then
    raise exception 'BeingU is for users aged 18 and above';
  end if;
  return new;
end;
$$;

create trigger profiles_adult_check
  before insert or update of date_of_birth on public.profiles
  for each row execute function public.enforce_adult_profile();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- User interests (with skill level and "want to learn" flag)
-- ---------------------------------------------------------------------------
create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  skill_level text not null default 'beginner' check (skill_level in ('beginner', 'intermediate', 'advanced')),
  is_favorite boolean not null default false,
  wants_to_learn boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);
create index user_interests_interest_idx on public.user_interests (interest_id);

create trigger user_interests_updated_at before update on public.user_interests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.states_uts enable row level security;
alter table public.cities enable row level security;
alter table public.interest_categories enable row level security;
alter table public.interests enable row level security;
alter table public.profiles enable row level security;
alter table public.user_interests enable row level security;

-- Reference data: signed-in users can read; only the service role (admin tools) can write.
create policy "reference: states readable by signed-in users"
  on public.states_uts for select to authenticated using (true);
create policy "reference: cities readable by signed-in users"
  on public.cities for select to authenticated using (true);
create policy "reference: categories readable by signed-in users"
  on public.interest_categories for select to authenticated using (true);
create policy "reference: approved interests readable by signed-in users"
  on public.interests for select to authenticated using (is_approved or created_by = (select auth.uid()));
create policy "interests: signed-in users may suggest a new interest (unapproved)"
  on public.interests for insert to authenticated
  with check (is_approved = false and created_by = (select auth.uid()));

-- Profiles: you always see your own; others only see public profiles. Nobody can change another user's row.
create policy "profiles: read own or public"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or profile_visibility = 'public');
create policy "profiles: insert own row"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles: update own row"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- No delete policy: account deletion goes through a server-side function that removes the auth user.

-- User interests: owner full control; others see them only when the profile is public.
create policy "user_interests: read own or public profile"
  on public.user_interests for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = user_interests.user_id and p.profile_visibility = 'public'
    )
  );
create policy "user_interests: manage own"
  on public.user_interests for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "user_interests: update own"
  on public.user_interests for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "user_interests: delete own"
  on public.user_interests for delete to authenticated
  using (user_id = (select auth.uid()));
