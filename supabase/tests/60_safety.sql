-- Blocking, reporting, moderation, appeals and audit (migration 0006).
create or replace function pg_temp.check(name text, ok boolean) returns void language plpgsql as $$
begin if ok then raise notice 'PASS: %', name; else raise notice 'FAIL: %', name; end if; end $$;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000050'), ('00000000-0000-0000-0000-000000000051'),
  ('00000000-0000-0000-0000-000000000052'), ('00000000-0000-0000-0000-000000000053'),
  ('00000000-0000-0000-0000-000000000054');
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-000000000050', 'sf_admin', 'Admin', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-000000000051', 'sf_mod', 'Moderator', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-000000000052', 'sf_reporter', 'Reporter', '1990-01-01', 'private'),
  ('00000000-0000-0000-0000-000000000053', 'sf_target', 'Target', '1990-01-01', 'public'),
  ('00000000-0000-0000-0000-000000000054', 'sf_other', 'Other', '1990-01-01', 'public');
insert into public.admin_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000050', 'admin'),
  ('00000000-0000-0000-0000-000000000051', 'moderator');

-- Blocking: a block hides each person from the other, and only the blocker can see it.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', false);
select public.block_user('00000000-0000-0000-0000-000000000053');
do $$ declare n int; declare nm text; begin
  select count(*), max(username) into n, nm from public.list_my_blocks();
  perform pg_temp.check('the blocked list shows the blocked person by name', n = 1 and nm = 'sf_target');
end $$;
do $$ declare n int; begin
  select count(*) into n from public.blocks
    where blocker_id = '00000000-0000-0000-0000-000000000052' and blocked_id = '00000000-0000-0000-0000-000000000053';
  perform pg_temp.check('block_user records the block', n = 1);
  select count(*) into n from public.profiles where username = 'sf_target';
  perform pg_temp.check('a blocked profile is hidden from the blocker', n = 0);
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000053', false);
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'sf_reporter';
  perform pg_temp.check('a block also hides the blocker from the blocked person', n = 0);
  select count(*) into n from public.blocks;
  perform pg_temp.check('the blocked person cannot see who blocked them', n = 0);
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'sf_target';
  perform pg_temp.check('an unrelated person still sees the public profile', n = 1);
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', false);
do $$ begin
  begin perform public.block_user('00000000-0000-0000-0000-000000000052');
    perform pg_temp.check('cannot block yourself', false);
  exception when others then perform pg_temp.check('cannot block yourself', sqlerrm like '%yourself%'); end;
  begin insert into public.blocks (blocker_id, blocked_id) values
      ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000054');
    perform pg_temp.check('clients cannot write blocks directly', false);
  exception when insufficient_privilege then perform pg_temp.check('clients cannot write blocks directly', true); end;
end $$;
select public.unblock_user('00000000-0000-0000-0000-000000000053');
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'sf_target';
  perform pg_temp.check('unblocking brings the profile back', n = 1);
end $$;
select public.block_user('00000000-0000-0000-0000-000000000053');

-- Reporting
select public.submit_report('user', '00000000-0000-0000-0000-000000000053', 'harassment',
  'Sent repeated unwanted messages', 'Screenshot kept on my phone');
do $$ declare n int; begin
  select count(*) into n from public.reports r
    join public.report_evidence e on e.report_id = r.id
    where r.reporter_id = '00000000-0000-0000-0000-000000000052' and r.target_id = '00000000-0000-0000-0000-000000000053';
  perform pg_temp.check('a report is saved with its evidence note', n = 1);
end $$;
do $$ begin
  begin perform public.submit_report('user', '00000000-0000-0000-0000-000000000053', 'harassment', null, null);
    perform pg_temp.check('the same open report cannot be sent twice', false);
  exception when others then perform pg_temp.check('the same open report cannot be sent twice', sqlerrm like '%already reported%'); end;
  begin perform public.submit_report('user', '00000000-0000-0000-0000-000000000054', 'made-up', null, null);
    perform pg_temp.check('unknown categories are refused by the database', false);
  exception when others then perform pg_temp.check('unknown categories are refused by the database', sqlerrm like '%check constraint%'); end;
  begin perform public.submit_report('post', '00000000-0000-0000-0000-000000000054', 'spam', null, null);
    perform pg_temp.check('reporting posts says not available yet', false);
  exception when others then perform pg_temp.check('reporting posts says not available yet', sqlerrm like '%not available yet%'); end;
  begin perform public.submit_report('user', '00000000-0000-0000-0000-000000000052', 'spam', null, null);
    perform pg_temp.check('cannot report yourself', false);
  exception when others then perform pg_temp.check('cannot report yourself', sqlerrm like '%yourself%'); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ declare n int; begin
  select count(*) into n from public.reports where target_id = '00000000-0000-0000-0000-000000000053';
  perform pg_temp.check('an ordinary person cannot see other reports', n = 0);
  select count(*) into n from public.audit_log;
  perform pg_temp.check('an ordinary person cannot read the audit log', n = 0);
end $$;

-- Moderation: a moderator may warn but not ban; a reporter may not review at all.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', false);
do $$ begin
  begin perform public.admin_review_report((select id from public.reports where reporter_id = '00000000-0000-0000-0000-000000000052' limit 1),
      'dismiss', 'Not a real problem at all', null);
    perform pg_temp.check('people without a role cannot review reports', false);
  exception when others then perform pg_temp.check('people without a role cannot review reports', sqlerrm like '%Not allowed%'); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', false);
do $$ declare rid uuid; begin
  select id into rid from public.reports where reporter_id = '00000000-0000-0000-0000-000000000052' limit 1;
  begin perform public.admin_review_report(rid, 'ban', 'Repeated harassment after a warning', null);
    perform pg_temp.check('moderators cannot ban', false);
  exception when others then perform pg_temp.check('moderators cannot ban', sqlerrm like '%Only admins%'); end;
  begin perform public.admin_review_report(rid, 'warn', 'short', null);
    perform pg_temp.check('decisions need a reason of 10+ characters', false);
  exception when others then perform pg_temp.check('decisions need a reason of 10+ characters', sqlerrm like '%at least 10%'); end;
  perform public.admin_review_report(rid, 'warn', 'Warned about harassing messages', null);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.reports where status = 'actioned';
  perform pg_temp.check('a warning marks the report actioned', n >= 1);
  select count(*) into n from public.account_status where user_id = '00000000-0000-0000-0000-000000000053';
  perform pg_temp.check('a warning does not change the account status', n = 0);
  select count(*) into n from public.moderation_actions where subject_user_id = '00000000-0000-0000-0000-000000000053' and action = 'warn';
  perform pg_temp.check('the warning is recorded in moderation history', n = 1);
end $$;

-- A second report, then an admin bans.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
select public.submit_report('user', '00000000-0000-0000-0000-000000000053', 'bullying', 'Posted cruel comments about me', null);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', false);
do $$ declare rid uuid; begin
  select id into rid from public.reports where reporter_id = '00000000-0000-0000-0000-000000000054' limit 1;
  perform public.admin_review_report(rid, 'ban', 'Repeated harassment after a warning', null);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.account_status where user_id = '00000000-0000-0000-0000-000000000053' and status = 'banned';
  perform pg_temp.check('an admin ban sets the account to banned', n = 1);
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'sf_target';
  perform pg_temp.check('a banned profile is hidden from others', n = 0);
end $$;

-- Appeals
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000053', false);
select public.submit_appeal((select id from public.moderation_actions where subject_user_id = '00000000-0000-0000-0000-000000000053' and action = 'ban'),
  'I think this was a mistake, please review it.');
do $$ declare n int; begin
  select count(*) into n from public.appeals where user_id = '00000000-0000-0000-0000-000000000053';
  perform pg_temp.check('a banned person can appeal their decision', n = 1);
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ begin
  begin perform public.submit_appeal((select id from public.moderation_actions where subject_user_id = '00000000-0000-0000-0000-000000000053' and action = 'ban'),
      'I am not involved, but I would like to appeal.');
    perform pg_temp.check('only the affected person can appeal', false);
  exception when others then perform pg_temp.check('only the affected person can appeal', sqlerrm like '%can only appeal%'); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', false);
select public.admin_decide_appeal((select id from public.appeals where user_id = '00000000-0000-0000-0000-000000000053'), false);
do $$ declare n int; begin
  select count(*) into n from public.account_status where user_id = '00000000-0000-0000-0000-000000000053' and status = 'active';
  perform pg_temp.check('an overturned appeal lifts the ban', n = 1);
  begin perform public.admin_decide_appeal((select id from public.appeals where user_id = '00000000-0000-0000-0000-000000000053'), true);
    perform pg_temp.check('an appeal cannot be decided twice', false);
  exception when others then perform pg_temp.check('an appeal cannot be decided twice', sqlerrm like '%already decided%'); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ declare n int; begin
  select count(*) into n from public.profiles where username = 'sf_target';
  perform pg_temp.check('the profile is visible again after an overturned ban', n = 1);
end $$;

-- Roles: only admins grant roles; the audit log is readable by admins only.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', false);
do $$ begin
  begin perform public.admin_grant_role('00000000-0000-0000-0000-000000000054', 'admin');
    perform pg_temp.check('moderators cannot grant roles', false);
  exception when others then perform pg_temp.check('moderators cannot grant roles', sqlerrm like '%Not allowed%'); end;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000050', false);
select public.admin_grant_role('00000000-0000-0000-0000-000000000054', 'moderator');
do $$ declare n int; begin
  select count(*) into n from public.admin_roles where user_id = '00000000-0000-0000-0000-000000000054' and role = 'moderator';
  perform pg_temp.check('an admin can grant a moderator role', n = 1);
  select count(*) into n from public.audit_log where actor_id = '00000000-0000-0000-0000-000000000050';
  perform pg_temp.check('admin decisions are written to the audit log', n >= 3);
end $$;
reset role;

-- A suspension stops reports while it lasts, and ends when its date passes.
insert into public.account_status (user_id, status, until) values
  ('00000000-0000-0000-0000-000000000054', 'suspended', now() + interval '1 day');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', false);
do $$ begin
  begin perform public.submit_report('user', '00000000-0000-0000-0000-000000000052', 'spam', null, null);
    perform pg_temp.check('a suspended person cannot submit reports', false);
  exception when others then perform pg_temp.check('a suspended person cannot submit reports', sqlerrm like '%cannot submit reports%'); end;
end $$;
reset role;
update public.account_status set until = now() - interval '1 day' where user_id = '00000000-0000-0000-0000-000000000054';
do $$ begin
  perform pg_temp.check('an expired suspension no longer restricts the account', not public.account_restricted('00000000-0000-0000-0000-000000000054'));
end $$;

-- Attack checks: an ordinary signed-in person tries to change safety data directly.
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000005f');
insert into public.profiles (id, username, display_name, date_of_birth, profile_visibility) values
  ('00000000-0000-0000-0000-00000000005f', 'sf_attacker', 'Attacker', '1990-01-01', 'public');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000005f', false);
do $$ begin
  begin insert into public.admin_roles (user_id, role) values ('00000000-0000-0000-0000-00000000005f', 'admin');
    perform pg_temp.check('an ordinary person cannot make themselves an admin', false);
  exception when insufficient_privilege then perform pg_temp.check('an ordinary person cannot make themselves an admin', true); end;
  begin update public.account_status set status = 'active';
    perform pg_temp.check('an ordinary person cannot change account status', false);
  exception when insufficient_privilege then perform pg_temp.check('an ordinary person cannot change account status', true); end;
  begin insert into public.moderation_actions (subject_user_id, action, reason) values
      ('00000000-0000-0000-0000-00000000005f', 'warn', 'Forged warning from the client');
    perform pg_temp.check('an ordinary person cannot forge a moderation decision', false);
  exception when insufficient_privilege then perform pg_temp.check('an ordinary person cannot forge a moderation decision', true); end;
  begin update public.reports set status = 'dismissed';
    perform pg_temp.check('an ordinary person cannot change a report', false);
  exception when insufficient_privilege then perform pg_temp.check('an ordinary person cannot change a report', true); end;
  begin delete from public.audit_log;
    perform pg_temp.check('an ordinary person cannot erase the audit log', false);
  exception when insufficient_privilege then perform pg_temp.check('an ordinary person cannot erase the audit log', true); end;
  begin perform public.admin_grant_role('00000000-0000-0000-0000-00000000005f', 'admin');
    perform pg_temp.check('an ordinary person cannot call the role function to escalate', false);
  exception when others then perform pg_temp.check('an ordinary person cannot call the role function to escalate', sqlerrm like '%Not allowed%'); end;
end $$;
do $$ declare n int; begin
  select count(*) into n from public.admin_roles where user_id = '00000000-0000-0000-0000-00000000005f';
  perform pg_temp.check('the escalation attempts left no admin role behind', n = 0);
end $$;
reset role;

-- Notices: a new decision counts as unseen until the person opens the notices screen.
insert into public.moderation_actions (subject_user_id, action, reason, actor_id) values
  ('00000000-0000-0000-0000-00000000005f', 'warn', 'Warned about spam messages', '00000000-0000-0000-0000-000000000050'),
  ('00000000-0000-0000-0000-00000000005f', 'dismiss', 'Report did not meet our rules', '00000000-0000-0000-0000-000000000050');
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000005f', false);
do $$ declare n int; begin
  select public.count_unseen_notices() into n;
  perform pg_temp.check('a new decision is counted as unseen, dismissals are not', n = 1);
end $$;
select public.mark_notices_seen();
do $$ declare n int; begin
  select public.count_unseen_notices() into n;
  perform pg_temp.check('opening notices clears the unseen count', n = 0);
end $$;
do $$ declare n int; begin
  begin insert into public.notice_reads (user_id) values ('00000000-0000-0000-0000-00000000005f');
    perform pg_temp.check('clients cannot write notice reads directly', false);
  exception when insufficient_privilege then perform pg_temp.check('clients cannot write notice reads directly', true); end;
end $$;
reset role;
