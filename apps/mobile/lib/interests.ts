import { supabase } from './supabase';
import { customSlug, toSavePayload, type PickedInterest, type SkillLevel } from './interestRules';

export type Category = { id: string; slug: string; name_en: string; sort_order: number };
export type LibraryInterest = {
  id: string;
  slug: string;
  name_en: string;
  category_id: string;
  is_approved: boolean;
  created_by: string | null;
};

// Everything is read from the database (seeded library). Nothing is hard-coded here.
export async function fetchLibrary(): Promise<{ categories: Category[]; interests: LibraryInterest[] }> {
  const [cats, ints] = await Promise.all([
    supabase.from('interest_categories').select('id, slug, name_en, sort_order').order('sort_order'),
    supabase.from('interests').select('id, slug, name_en, category_id, is_approved, created_by').order('name_en'),
  ]);
  if (cats.error) throw cats.error;
  if (ints.error) throw ints.error;
  return { categories: (cats.data ?? []) as Category[], interests: (ints.data ?? []) as LibraryInterest[] };
}

// The signed-in user's saved picks, in the shape the screen uses.
export async function fetchMyInterests(userId: string): Promise<PickedInterest[]> {
  const { data, error } = await supabase
    .from('user_interests')
    .select('skill_level, is_favorite, wants_to_learn, interests(id, name_en)')
    .eq('user_id', userId);
  if (error) throw error;
  type Row = {
    skill_level: SkillLevel;
    is_favorite: boolean;
    wants_to_learn: boolean;
    interests: { id: string; name_en: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.interests !== null)
    .map((r) => ({
      id: r.interests!.id,
      name: r.interests!.name_en,
      skill: r.skill_level,
      favorite: r.is_favorite,
      wantsToLearn: r.wants_to_learn,
    }));
}

// Saves the whole selection in one database call. Either all of it saves or none of it does.
export async function saveMyInterests(picks: PickedInterest[]): Promise<void> {
  const { error } = await supabase.rpc('save_my_interests', { items: toSavePayload(picks) });
  if (error) throw error;
}

// Adds a custom interest. It is saved as unapproved, so only its creator sees it until a moderator approves it.
export async function addCustomInterest(
  userId: string,
  otherCategoryId: string,
  name: string,
): Promise<LibraryInterest> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const { data, error } = await supabase
    .from('interests')
    .insert({
      category_id: otherCategoryId,
      slug: customSlug(name, suffix),
      name_en: name,
      is_approved: false,
      created_by: userId,
    })
    .select('id, slug, name_en, category_id, is_approved, created_by')
    .single();
  if (error) throw error;
  return data as LibraryInterest;
}
