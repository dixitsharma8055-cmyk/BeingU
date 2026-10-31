import { supabase } from './supabase';

export type DiscoverPerson = {
  userId: string;
  username: string;
  displayName: string;
  stateName: string | null;
  sharedNames: string[];
};

// People with public profiles who share at least one of your interests, most shared first.
// The ranking and privacy rules run in the database (migration 0004), not only here.
export async function fetchDiscover(): Promise<DiscoverPerson[]> {
  const { data, error } = await supabase.rpc('discover_people', { max_rows: 30 });
  if (error) throw error;
  type Row = {
    user_id: string;
    username: string;
    display_name: string;
    state_name: string | null;
    shared_names: string[] | null;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    userId: r.user_id,
    username: r.username,
    displayName: r.display_name,
    stateName: r.state_name,
    sharedNames: r.shared_names ?? [],
  }));
}

export async function setMyVisibility(userId: string, visibility: 'public' | 'private'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ profile_visibility: visibility })
    .eq('id', userId);
  if (error) throw error;
}
