import { supabase } from './supabase';

export type MyProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  state_name: string | null;
  profile_visibility: 'public' | 'private';
};

// Reads the signed-in user's own profile, with the state name. Row Level Security limits this to their own row.
export async function fetchMyProfile(userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, profile_visibility, states_uts(name)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    profile_visibility: 'public' | 'private';
    states_uts: { name: string } | null;
  };
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    state_name: row.states_uts?.name ?? null,
    profile_visibility: row.profile_visibility,
  };
}
