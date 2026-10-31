import { supabase } from './supabase';
import type { PickedInterest, SkillLevel } from './interestRules';

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  state_name: string | null;
};

// Another person's profile. Only public profiles come back: Row Level Security hides private ones,
// so a private profile and a missing profile look exactly the same to the app.
export async function fetchPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, states_uts(name)')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    states_uts: { name: string } | null;
  };
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    state_name: row.states_uts?.name ?? null,
  };
}

// Interests of the person whose profile is open. Visible only when their profile is public (RLS).
export async function fetchInterestsOf(userId: string): Promise<PickedInterest[]> {
  const { data, error } = await supabase
    .from('user_interests')
    .select('skill_level, is_favorite, wants_to_learn, interests(id, slug, name_en)')
    .eq('user_id', userId);
  if (error) throw error;
  type Row = {
    skill_level: SkillLevel;
    is_favorite: boolean;
    wants_to_learn: boolean;
    interests: { id: string; slug: string; name_en: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.interests !== null)
    .map((r) => ({
      id: r.interests!.id,
      slug: r.interests!.slug,
      name: r.interests!.name_en,
      skill: r.skill_level,
      favorite: r.is_favorite,
      wantsToLearn: r.wants_to_learn,
    }));
}

export async function fetchMyInterestIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('user_interests').select('interest_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: { interest_id: string }) => r.interest_id);
}
