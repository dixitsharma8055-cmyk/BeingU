import { supabase } from './supabase';
import { appealSchema, reportSchema, type ReportInput } from './safetyRules';

// Every call goes to a database function that checks the caller. The app never writes these tables directly.

export type BlockedPerson = { user_id: string; username: string; display_name: string; blocked_at: string };

export async function blockPerson(userId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { target: userId });
  if (error) throw error;
}

export async function unblockPerson(userId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { target: userId });
  if (error) throw error;
}

export async function fetchBlockedPeople(): Promise<BlockedPerson[]> {
  const { data, error } = await supabase.rpc('list_my_blocks');
  if (error) throw error;
  return (data ?? []) as BlockedPerson[];
}

// Validates on the phone first, then the database checks again (category list, length, duplicates).
export async function reportPerson(targetId: string, input: ReportInput): Promise<void> {
  const parsed = reportSchema.parse(input);
  const { error } = await supabase.rpc('submit_report', {
    p_target_type: 'user',
    p_target_id: targetId,
    p_category: parsed.category,
    p_details: parsed.details || null,
    p_evidence_note: parsed.evidenceNote || null,
  });
  if (error) throw error;
}

export type Notice = {
  id: string;
  action: 'warn' | 'restrict' | 'suspend' | 'ban';
  reason: string;
  until: string | null;
  created_at: string;
  appeal_status: 'open' | 'upheld' | 'overturned' | null;
};

// Decisions made about my account, with the status of any appeal I have made.
export async function fetchMyNotices(userId: string): Promise<Notice[]> {
  const [actions, appeals] = await Promise.all([
    supabase
      .from('moderation_actions')
      .select('id, action, reason, until, created_at')
      .eq('subject_user_id', userId)
      .neq('action', 'dismiss')
      .order('created_at', { ascending: false }),
    supabase.from('appeals').select('action_id, status').eq('user_id', userId),
  ]);
  if (actions.error) throw actions.error;
  if (appeals.error) throw appeals.error;
  const byAction = new Map((appeals.data ?? []).map((a: { action_id: string; status: Notice['appeal_status'] }) => [a.action_id, a.status]));
  return ((actions.data ?? []) as Omit<Notice, 'appeal_status'>[]).map((n) => ({
    ...n,
    appeal_status: byAction.get(n.id) ?? null,
  })) as Notice[];
}

export async function appealDecision(actionId: string, message: string): Promise<void> {
  const parsed = appealSchema.parse({ message });
  const { error } = await supabase.rpc('submit_appeal', { p_action_id: actionId, p_message: parsed.message });
  if (error) throw error;
}

// How many decisions about my account I have not opened yet. Failing quietly is fine: it only drives a count.
export async function countUnseenNotices(): Promise<number> {
  const { data, error } = await supabase.rpc('count_unseen_notices');
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}

export async function markNoticesSeen(): Promise<void> {
  const { error } = await supabase.rpc('mark_notices_seen');
  if (error) throw error;
}
