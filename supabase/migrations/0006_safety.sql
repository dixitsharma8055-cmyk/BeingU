-- BeingU — Migration 0006: blocking, reporting, moderation, appeals, audit log (NOT YET APPLIED)
--
-- Design rules:
--  * Clients get READ access only (through Row Level Security). Every change goes through a function
--    that checks who is calling. Tables grant no direct insert, update or delete to signed-in users.
--  * Staff roles live in admin_roles. Only admins can ban or suspend, and only admins can grant roles.
--  * Every staff decision is written to audit_log.
--  * Reporting of posts, comments, messages and communities is accepted by the schema but refused by
--    the function until those tables exist.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create table public.account_status (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'restricted', 'suspended', 'banned')),
  until timestamptz,
  reason text,
  updated_at timestamptz not null default now()
);

create table public.admin_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('user', 'post', 'comment', 'message', 'community')),
  target_id uuid not null,
  subject_user_id uuid references public.profiles (id) on delete set null,
  category text not null check (category in (
    'harassment', 'bullying', 'impersonation', 'spam', 'inappropriate_content', 'scam', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One open report per person per item, so the same thing cannot be reported over and over.
create unique index reports_open_once_idx on public.reports (reporter_id, target_type, target_id)
  where status in ('open', 'reviewing');
create index reports_status_idx on public.reports (status, created_at);
create index reports_subject_idx on public.reports (subject_user_id);

create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  note text not null check (char_length(note) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete set null,
  -- Kept as NULL (not deleted) when an account is deleted, so moderation records survive.
  subject_user_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('dismiss', 'warn', 'restrict', 'suspend', 'ban')),
  reason text not null check (char_length(reason) between 10 and 1000),
  until timestamptz,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index moderation_actions_subject_idx on public.moderation_actions (subject_user_id, created_at);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null unique references public.moderation_actions (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  message text not null check (char_length(message) between 10 and 1000),
  status text not null default 'open' check (status in ('open', 'upheld', 'overturned')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (used by Row Level Security). Security definer so that
-- nobody can see who blocked them, or staff status, through the policy checks.
-- ---------------------------------------------------------------------------
create or replace function public.blocked_either_way(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.account_restricted(u uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_status s
    where s.user_id = u
      and (s.status = 'banned'
           or (s.status = 'suspended' and (s.until is null or s.until > now())))
  );
$$;

create or replace function public.is_staff(u uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_roles r where r.user_id = u);
$$;

create or replace function public.is_admin(u uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_roles r where r.user_id = u and r.role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Profiles: a block or a suspension hides the profile everywhere it is read.
-- This replaces the policy from migration 0001 (policy replacement only; no data changes).
-- ---------------------------------------------------------------------------
drop policy "profiles: read own or public" on public.profiles;
create policy "profiles: read own or public"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (
      profile_visibility = 'public'
      and not public.blocked_either_way((select auth.uid()), id)
      and not public.account_restricted(id)
    )
  );

-- ---------------------------------------------------------------------------
-- Row Level Security: read-only for clients, scoped to the person (or staff)
-- ---------------------------------------------------------------------------
alter table public.blocks enable row level security;
alter table public.account_status enable row level security;
alter table public.admin_roles enable row level security;
alter table public.reports enable row level security;
alter table public.report_evidence enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.appeals enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.blocks, public.account_status, public.admin_roles, public.reports,
  public.report_evidence, public.moderation_actions, public.appeals, public.audit_log
  from anon, authenticated;
-- Table privileges only open the door; the row policies below decide what each person sees.
grant select on public.blocks, public.account_status, public.admin_roles, public.reports,
  public.report_evidence, public.moderation_actions, public.appeals, public.audit_log to authenticated;

create policy "blocks: read own" on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));

create policy "account_status: read own or staff" on public.account_status for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy "admin_roles: read own or admin" on public.admin_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin((select auth.uid())));

create policy "reports: read own or staff" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy "report_evidence: read own report or staff" on public.report_evidence for select to authenticated
  using (
    exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = (select auth.uid()))
    or public.is_staff((select auth.uid()))
  );

create policy "moderation_actions: read own or staff" on public.moderation_actions for select to authenticated
  using (subject_user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy "appeals: read own or staff" on public.appeals for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- audit_log: no policy for ordinary users. Only admins may read it.
create policy "audit_log: admins read" on public.audit_log for select to authenticated
  using (public.is_admin((select auth.uid())));

-- ---------------------------------------------------------------------------
-- Functions: the only way to change safety data
-- ---------------------------------------------------------------------------
create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'You need to be signed in'; end if;
  if target = uid then raise exception 'You cannot block yourself'; end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'That person could not be found';
  end if;
  insert into public.blocks (blocker_id, blocked_id) values (uid, target)
  on conflict do nothing;
end;
$$;

create or replace function public.unblock_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'You need to be signed in'; end if;
  delete from public.blocks where blocker_id = uid and blocked_id = target;
end;
$$;

create or replace function public.submit_report(
  p_target_type text,
  p_target_id uuid,
  p_category text,
  p_details text,
  p_evidence_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  subject uuid;
  new_id uuid;
begin
  if uid is null then raise exception 'You need to be signed in'; end if;
  if public.account_restricted(uid) then
    raise exception 'Your account cannot submit reports right now';
  end if;
  if p_target_type <> 'user' then
    raise exception 'Reporting this kind of content is not available yet';
  end if;
  if p_target_id = uid then raise exception 'You cannot report yourself'; end if;
  select id into subject from public.profiles where id = p_target_id;
  if subject is null then raise exception 'That person could not be found'; end if;

  insert into public.reports (reporter_id, target_type, target_id, subject_user_id, category, details)
  values (uid, p_target_type, p_target_id, subject, p_category, nullif(trim(p_details), ''))
  returning id into new_id;

  if p_evidence_note is not null and trim(p_evidence_note) <> '' then
    insert into public.report_evidence (report_id, note) values (new_id, trim(p_evidence_note));
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (uid, 'report.submit', p_target_type, p_target_id, jsonb_build_object('report_id', new_id, 'category', p_category));
  return new_id;
exception
  when unique_violation then
    raise exception 'You have already reported this. We are looking at it.';
end;
$$;

-- Names of the people I have blocked. Their profiles are hidden from me, so this returns just what the list needs.
create or replace function public.list_my_blocks()
returns table (user_id uuid, username text, display_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, b.created_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;

create or replace function public.submit_appeal(p_action_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  new_id uuid;
begin
  if uid is null then raise exception 'You need to be signed in'; end if;
  if not exists (
    select 1 from public.moderation_actions a
    where a.id = p_action_id and a.subject_user_id = uid and a.action <> 'dismiss'
  ) then
    raise exception 'You can only appeal a decision made about your account';
  end if;
  insert into public.appeals (action_id, user_id, message)
  values (p_action_id, uid, trim(p_message))
  returning id into new_id;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (uid, 'appeal.submit', 'moderation_action', p_action_id, '{}'::jsonb);
  return new_id;
exception
  when unique_violation then
    raise exception 'You have already appealed this decision';
end;
$$;

create or replace function public.admin_review_report(
  p_report_id uuid,
  p_decision text,
  p_reason text,
  p_until timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  r public.reports%rowtype;
  new_id uuid;
begin
  if not public.is_staff(uid) then raise exception 'Not allowed'; end if;
  if p_decision not in ('dismiss', 'warn', 'restrict', 'suspend', 'ban') then
    raise exception 'Unknown decision';
  end if;
  if p_decision in ('suspend', 'ban') and not public.is_admin(uid) then
    raise exception 'Only admins can suspend or ban accounts';
  end if;
  if char_length(coalesce(trim(p_reason), '')) < 10 then
    raise exception 'Give a reason of at least 10 characters';
  end if;
  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if r.status not in ('open', 'reviewing') then raise exception 'This report is already decided'; end if;
  if r.subject_user_id is null then
    raise exception 'Only reports about people can be actioned at this stage';
  end if;

  insert into public.moderation_actions (report_id, subject_user_id, action, reason, until, actor_id)
  values (r.id, r.subject_user_id, p_decision, trim(p_reason), p_until, uid)
  returning id into new_id;

  if p_decision in ('restrict', 'suspend', 'ban') then
    insert into public.account_status (user_id, status, until, reason, updated_at)
    values (
      r.subject_user_id,
      case p_decision when 'restrict' then 'restricted' when 'suspend' then 'suspended' else 'banned' end,
      case when p_decision = 'ban' then null else p_until end,
      trim(p_reason),
      now()
    )
    on conflict (user_id) do update
      set status = excluded.status, until = excluded.until, reason = excluded.reason, updated_at = now();
  end if;

  update public.reports
    set status = case when p_decision = 'dismiss' then 'dismissed' else 'actioned' end,
        reviewed_by = uid, reviewed_at = now(), updated_at = now()
    where id = r.id;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (uid, 'report.decide', 'report', r.id,
          jsonb_build_object('decision', p_decision, 'action_id', new_id));
  return new_id;
end;
$$;

create or replace function public.admin_decide_appeal(p_appeal_id uuid, p_uphold boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  a public.appeals%rowtype;
  act public.moderation_actions%rowtype;
begin
  if not public.is_staff(uid) then raise exception 'Not allowed'; end if;
  select * into a from public.appeals where id = p_appeal_id for update;
  if not found then raise exception 'Appeal not found'; end if;
  if a.status <> 'open' then raise exception 'This appeal is already decided'; end if;
  select * into act from public.moderation_actions where id = a.action_id;

  update public.appeals
    set status = case when p_uphold then 'upheld' else 'overturned' end,
        decided_by = uid, decided_at = now()
    where id = a.id;

  -- Overturning lifts a restriction, suspension or ban that this decision created.
  if not p_uphold and act.action in ('restrict', 'suspend', 'ban') then
    update public.account_status
      set status = 'active', until = null, reason = null, updated_at = now()
      where user_id = act.subject_user_id;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (uid, 'appeal.decide', 'appeal', a.id, jsonb_build_object('upheld', p_uphold));
end;
$$;

create or replace function public.admin_grant_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if not public.is_admin(uid) then raise exception 'Not allowed'; end if;
  if p_role not in ('moderator', 'admin') then raise exception 'Unknown role'; end if;
  insert into public.admin_roles (user_id, role) values (p_user, p_role)
  on conflict (user_id) do update set role = excluded.role;
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (uid, 'role.grant', 'profile', p_user, jsonb_build_object('role', p_role));
end;
$$;

-- Clients may call only the functions meant for them.
revoke all on function public.blocked_either_way(uuid, uuid), public.account_restricted(uuid),
  public.is_staff(uuid), public.is_admin(uuid) from public, anon;
grant execute on function public.blocked_either_way(uuid, uuid), public.account_restricted(uuid),
  public.is_staff(uuid), public.is_admin(uuid) to authenticated;
revoke all on function public.block_user(uuid), public.unblock_user(uuid),
  public.submit_report(text, uuid, text, text, text), public.submit_appeal(uuid, text),
  public.admin_review_report(uuid, text, text, timestamptz), public.admin_decide_appeal(uuid, boolean),
  public.admin_grant_role(uuid, text), public.list_my_blocks() from public, anon;
grant execute on function public.block_user(uuid), public.unblock_user(uuid),
  public.submit_report(text, uuid, text, text, text), public.submit_appeal(uuid, text),
  public.admin_review_report(uuid, text, text, timestamptz), public.admin_decide_appeal(uuid, boolean),
  public.admin_grant_role(uuid, text), public.list_my_blocks() to authenticated;
