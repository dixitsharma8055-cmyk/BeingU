// Pure rules for choosing interests. No network or UI code here, so these can be unit-tested directly.
// The database (migration 0003) enforces the same limits; this file is for instant feedback in the app.

export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 20;
export const CUSTOM_MIN_LENGTH = 2;
export const CUSTOM_MAX_LENGTH = 40;

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export type PickedInterest = {
  id: string;
  name: string;
  skill: SkillLevel;
  favorite: boolean;
  wantsToLearn: boolean;
};

// Lower-case, trimmed, single spaces. Used for matching the search box.
export function normalizeQuery(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function matchesQuery(name: string, query: string): boolean {
  const q = normalizeQuery(query);
  if (q === '') return true;
  return name.toLowerCase().includes(q);
}

export function canContinue(count: number): boolean {
  return count >= MIN_INTERESTS && count <= MAX_INTERESTS;
}

export function remainingToMinimum(count: number): number {
  return Math.max(0, MIN_INTERESTS - count);
}

// Letters (including Hindi and other Indian scripts), digits, spaces, and & ' -.
const CUSTOM_ALLOWED = /^[\p{L}\p{M}\p{N} &'-]+$/u;

export function validateCustomName(
  raw: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < CUSTOM_MIN_LENGTH) {
    return { ok: false, error: `Use at least ${CUSTOM_MIN_LENGTH} characters` };
  }
  if (name.length > CUSTOM_MAX_LENGTH) {
    return { ok: false, error: `Use ${CUSTOM_MAX_LENGTH} characters or fewer` };
  }
  if (!CUSTOM_ALLOWED.test(name)) {
    return { ok: false, error: 'Use letters, numbers, spaces, & or apostrophes only' };
  }
  return { ok: true, name };
}

// URL-friendly slug. Non-Latin names become "interest" and get a random suffix to stay unique.
export function slugify(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || 'interest';
}

export function customSlug(name: string, randomSuffix: string): string {
  return `${slugify(name)}-${randomSuffix}`;
}

// The list sent to the database. Order is preserved; interest ids must be unique.
export function toSavePayload(picks: PickedInterest[]) {
  return picks.map((p) => ({
    interest_id: p.id,
    skill_level: p.skill,
    is_favorite: p.favorite,
    wants_to_learn: p.wantsToLearn,
  }));
}
