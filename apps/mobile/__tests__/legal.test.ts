import { LEGAL_DOCS, allText, findLegalDoc, GRIEVANCE_EMAIL } from '@/legal/content';

// NOTE: written but NOT run yet (Jest not installed). Run `npm test` once installed.

const KNOWN_PLACEHOLDERS = [
  '[COMPANY LEGAL NAME]',
  '[GRIEVANCE OFFICER EMAIL]',
  '[GRIEVANCE OFFICER NAME AND DESIGNATION]',
  '[CITY WHERE COURTS ARE LOCATED]',
  '[DATE OF PUBLICATION]',
  '[COUNSEL TO CONFIRM: list any service providers that process data outside India, and the safeguards used.]',
  '[COUNSEL TO SET RETENTION PERIODS FOR LOGS AND REPORTS.]',
];

describe('legal documents', () => {
  it('has the three documents the app links to', () => {
    expect(LEGAL_DOCS.map((d) => d.slug).sort()).toEqual(['community', 'privacy', 'terms']);
  });

  it('every document has sections with text', () => {
    for (const d of LEGAL_DOCS) {
      expect(d.sections.length).toBeGreaterThan(3);
      for (const s of d.sections) expect(s.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('terms and privacy state the 18+ rule and the account deletion right', () => {
    expect(findLegalDoc('terms')!.sections.some((s) => s.paragraphs.join(' ').includes('18 years'))).toBe(true);
    expect(allText()).toMatch(/delete your account/i);
  });

  it('privacy policy says location is off by default and never shows exact positions', () => {
    const text = findLegalDoc('privacy')!.sections.flatMap((s) => s.paragraphs).join(' ');
    expect(text).toMatch(/off by default/);
    expect(text).toMatch(/never your exact address/);
  });

  it('privacy policy does not claim data is sold', () => {
    expect(allText()).toMatch(/do not sell your personal data/i);
  });

  it('only the known placeholders appear, so none are added silently', () => {
    const found = new Set(allText().match(/\[[A-Z][^\]]*\]/g) ?? []);
    for (const p of found) expect(KNOWN_PLACEHOLDERS).toContain(p);
  });

  it('the grievance contact is a placeholder until counsel fills it in', () => {
    expect(GRIEVANCE_EMAIL).toMatch(/^\[/);
  });
});
