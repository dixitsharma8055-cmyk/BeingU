import {
  canContinue,
  customSlug,
  matchesQuery,
  normalizeQuery,
  remainingToMinimum,
  slugify,
  toSavePayload,
  validateCustomName,
} from '@/lib/interestRules';

// NOTE: written but NOT run yet (Jest is not installed in this workspace). Run `npm test` once installed.

describe('search', () => {
  it('normalises spacing and case', () => {
    expect(normalizeQuery('  Indie   MUSIC ')).toBe('indie music');
  });
  it('matches anywhere in the name, ignoring case', () => {
    expect(matchesQuery('Indie Music', 'music')).toBe(true);
    expect(matchesQuery('Indie Music', 'GUITAR')).toBe(false);
  });
  it('an empty query matches everything', () => {
    expect(matchesQuery('Guitar', '   ')).toBe(true);
  });
});

describe('selection limits', () => {
  it.each([[0, false], [2, false], [3, true], [20, true], [21, false]])('count %i -> continue %s', (n, ok) => {
    expect(canContinue(n)).toBe(ok);
  });
  it('tells the user how many more they need', () => {
    expect(remainingToMinimum(1)).toBe(2);
    expect(remainingToMinimum(5)).toBe(0);
  });
});

describe('custom interest names', () => {
  it('accepts letters, digits, spaces and Hindi script', () => {
    expect(validateCustomName('  Rock  Climbing ')).toEqual({ ok: true, name: 'Rock Climbing' });
    expect(validateCustomName('गिटार').ok).toBe(true);
    expect(validateCustomName("Rock & Roll's").ok).toBe(true);
  });
  it('rejects too short, too long and symbols', () => {
    expect(validateCustomName('a').ok).toBe(false);
    expect(validateCustomName('x'.repeat(41)).ok).toBe(false);
    expect(validateCustomName('<script>').ok).toBe(false);
  });
});

describe('slugs', () => {
  it('makes URL-safe slugs', () => {
    expect(slugify('Rock & Roll!')).toBe('rock-roll');
    expect(slugify('Café Hopping')).toBe('cafe-hopping');
  });
  it('falls back for non-Latin names and adds a suffix', () => {
    expect(slugify('गिटार')).toBe('interest');
    expect(customSlug('गिटार', 'k3j9x2')).toBe('interest-k3j9x2');
  });
});

describe('save payload', () => {
  it('maps picks to database column names and keeps order', () => {
    expect(
      toSavePayload([
        { id: 'a', name: 'Guitar', skill: 'advanced', favorite: true, wantsToLearn: false },
        { id: 'b', name: 'Chess', skill: 'beginner', favorite: false, wantsToLearn: true },
      ]),
    ).toEqual([
      { interest_id: 'a', skill_level: 'advanced', is_favorite: true, wants_to_learn: false },
      { interest_id: 'b', skill_level: 'beginner', is_favorite: false, wants_to_learn: true },
    ]);
  });
});
