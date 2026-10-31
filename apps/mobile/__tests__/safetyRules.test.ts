import { appealSchema, canAppeal, describeUntil, reportSchema, REPORT_CATEGORIES } from '@/lib/safetyRules';

describe('reportSchema', () => {
  it('needs a category from the approved list', () => {
    expect(reportSchema.safeParse({ category: 'harassment' }).success).toBe(true);
    expect(reportSchema.safeParse({ category: 'made-up' }).success).toBe(false);
    expect(reportSchema.safeParse({}).success).toBe(false);
  });

  it('caps details and the evidence note at 1000 characters', () => {
    const long = 'a'.repeat(1001);
    expect(reportSchema.safeParse({ category: 'spam', details: long }).success).toBe(false);
    expect(reportSchema.safeParse({ category: 'spam', evidenceNote: long }).success).toBe(false);
    expect(reportSchema.safeParse({ category: 'spam', details: 'a'.repeat(1000) }).success).toBe(true);
  });

  it('trims whitespace from the text fields', () => {
    const parsed = reportSchema.parse({ category: 'scam', details: '  looks fake  ' });
    expect(parsed.details).toBe('looks fake');
  });

  it('lists the seven categories from the brief', () => {
    expect(REPORT_CATEGORIES).toEqual([
      'harassment', 'bullying', 'impersonation', 'spam', 'inappropriate_content', 'scam', 'other',
    ]);
  });
});

describe('appealSchema', () => {
  it('needs at least 10 characters', () => {
    expect(appealSchema.safeParse({ message: 'too short' }).success).toBe(false);
    expect(appealSchema.safeParse({ message: 'This was a mistake' }).success).toBe(true);
  });

  it('ignores surrounding spaces when counting', () => {
    expect(appealSchema.safeParse({ message: '         short     ' }).success).toBe(false);
  });
});

describe('canAppeal', () => {
  it('lets people appeal a real decision once', () => {
    expect(canAppeal('ban', false)).toBe(true);
    expect(canAppeal('warn', true)).toBe(false);
  });

  it('never offers an appeal for a dismissed report', () => {
    expect(canAppeal('dismiss', false)).toBe(false);
  });
});

describe('describeUntil', () => {
  it('returns nothing for an open-ended decision', () => {
    expect(describeUntil(null)).toBeNull();
  });

  it('returns nothing for a date it cannot read', () => {
    expect(describeUntil('not a date')).toBeNull();
  });

  it('gives a readable end date', () => {
    expect(describeUntil('2030-03-05T00:00:00Z')).toMatch(/^Until .*2030$/);
  });
});
