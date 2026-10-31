import { parseIndianDate, profileSchema, toIsoDate, toProfileRow } from '@/lib/profile';

// NOTE: written but NOT run yet (Jest is not installed in this workspace). Run `npm test` once installed.

describe('parseIndianDate', () => {
  it('reads DD/MM/YYYY', () => {
    expect(toIsoDate(parseIndianDate('05/03/2000') as Date)).toBe('2000-03-05');
  });
  it.each(['31/02/2000', '00/01/2000', '2000-03-05', 'abc', ''])('rejects %s', (v) => {
    expect(parseIndianDate(v)).toBeNull();
  });
});

describe('profileSchema', () => {
  const base = { displayName: 'Asha', username: 'Asha_01', dateOfBirth: '01/01/1990', bio: '', stateId: null };

  it('accepts a valid adult profile and lower-cases the username', () => {
    const r = profileSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe('asha_01');
  });

  it('rejects a minor', () => {
    const today = new Date();
    const minorDob = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear() - 10}`;
    expect(profileSchema.safeParse({ ...base, dateOfBirth: minorDob }).success).toBe(false);
  });

  it.each(['ab', 'has space', 'emoji😀', 'x'.repeat(31)])('rejects username %s', (username) => {
    expect(profileSchema.safeParse({ ...base, username }).success).toBe(false);
  });

  it('rejects a bio over 300 characters', () => {
    expect(profileSchema.safeParse({ ...base, bio: 'x'.repeat(301) }).success).toBe(false);
  });
});

describe('toProfileRow', () => {
  it('maps to database column names and never includes role or visibility fields', () => {
    const row = toProfileRow('11111111-1111-1111-1111-111111111111', {
      displayName: ' Asha ', username: 'asha', dateOfBirth: '01/01/1990', bio: '', stateId: null,
    });
    expect(row).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      display_name: 'Asha',
      username: 'asha',
      date_of_birth: '1990-01-01',
      bio: null,
      state_uts_id: null,
    });
  });
});
