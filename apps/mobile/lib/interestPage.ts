import { supabase } from './supabase';

export type InterestDetail = { id: string; slug: string; name_en: string; category_id: string; category_name: string };
export type InterestPerson = { id: string; username: string; display_name: string; state_name: string | null };
export type RelatedInterest = { id: string; slug: string; name_en: string };

// Maximum people shown on one interest page. Pagination comes with the full discovery phase.
export const PEOPLE_PAGE_SIZE = 50;

export async function fetchInterestBySlug(slug: string): Promise<InterestDetail | null> {
  const { data, error } = await supabase
    .from('interests')
    .select('id, slug, name_en, category_id, interest_categories(name_en)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    slug: string;
    name_en: string;
    category_id: string;
    interest_categories: { name_en: string } | null;
  };
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name_en,
    category_id: row.category_id,
    category_name: row.interest_categories?.name_en ?? '',
  };
}

// People who have this interest and whose profile is public. Private profiles never appear here.
// Row Level Security enforces the same rule on the server.
export async function fetchInterestPeople(interestId: string, excludeUserId: string): Promise<InterestPerson[]> {
  const { data, error } = await supabase
    .from('user_interests')
    .select('user_id, profiles!inner(id, username, display_name, profile_visibility, states_uts(name))')
    .eq('interest_id', interestId)
    .eq('profiles.profile_visibility', 'public')
    .neq('user_id', excludeUserId)
    .limit(PEOPLE_PAGE_SIZE);
  if (error) throw error;
  return shapePeople(data ?? []);
}

// Turns the joined rows into simple objects. Kept separate so it can be tested without a network.
export function shapePeople(rows: unknown[]): InterestPerson[] {
  type Row = {
    profiles: {
      id: string;
      username: string;
      display_name: string;
      states_uts: { name: string } | null;
    } | null;
  };
  return (rows as Row[])
    .filter((r) => r.profiles !== null)
    .map((r) => ({
      id: r.profiles!.id,
      username: r.profiles!.username,
      display_name: r.profiles!.display_name,
      state_name: r.profiles!.states_uts?.name ?? null,
    }));
}

// Other interests from the same category, to help people explore.
export async function fetchRelatedInterests(categoryId: string, excludeId: string): Promise<RelatedInterest[]> {
  const { data, error } = await supabase
    .from('interests')
    .select('id, slug, name_en')
    .eq('category_id', categoryId)
    .eq('is_approved', true)
    .neq('id', excludeId)
    .order('name_en')
    .limit(12);
  if (error) throw error;
  return (data ?? []) as RelatedInterest[];
}
