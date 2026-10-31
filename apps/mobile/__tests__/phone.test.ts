import { ageOn, indianMobileSchema, isAdult, otpSchema, toE164, toNationalNumber } from '@/lib/phone';

// NOTE: these tests are written but have NOT been run yet. Dependencies (jest, ts-jest) are not installed
// because the npm registry is unreachable from the current workspace. Run `npm test` once installed.

describe('toNationalNumber', () => {
  it.each([
    ['98765 43210', '9876543210'],
    ['+91 98765-43210', '9876543210'],
    ['09876543210', '9876543210'],
    ['919876543210', '9876543210'],
  ])('normalises %s', (input, expected) => {
    expect(toNationalNumber(input)).toBe(expected);
  });
});

describe('indianMobileSchema', () => {
  it('accepts valid Indian mobile numbers starting with 6-9', () => {
    expect(indianMobileSchema.safeParse('9876543210').success).toBe(true);
    expect(indianMobileSchema.safeParse('6000000000').success).toBe(true);
  });

  it.each(['5876543210', '12345', '98765432101', '', 'abcdefghij'])('rejects %s', (input) => {
    expect(indianMobileSchema.safeParse(input).success).toBe(false);
  });
});

describe('toE164', () => {
  it('adds the +91 country code', () => {
    expect(toE164('9876543210')).toBe('+919876543210');
  });
});

describe('otpSchema', () => {
  it('requires exactly six digits', () => {
    expect(otpSchema.safeParse('123456').success).toBe(true);
    expect(otpSchema.safeParse('12345').success).toBe(false);
    expect(otpSchema.safeParse('12a456').success).toBe(false);
  });
});

describe('age rules', () => {
  const today = new Date(2026, 9, 31); // 31 October 2026

  it('counts whole years, not calendar years', () => {
    expect(ageOn(new Date(2008, 10, 1), today)).toBe(17); // turns 18 on 1 Nov 2026
    expect(ageOn(new Date(2008, 9, 31), today)).toBe(18); // turns 18 today
  });

  it('allows adults and blocks minors', () => {
    expect(isAdult(new Date(2008, 9, 31), today)).toBe(true);
    expect(isAdult(new Date(2008, 10, 1), today)).toBe(false);
  });
});
