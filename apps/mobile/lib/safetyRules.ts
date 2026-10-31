import { z } from 'zod';

// Report categories. The database enforces the same list (check constraint in migration 0006).
export const REPORT_CATEGORIES = [
  'harassment',
  'bullying',
  'impersonation',
  'spam',
  'inappropriate_content',
  'scam',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  harassment: 'Harassment',
  bullying: 'Bullying',
  impersonation: 'Impersonation',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate content',
  scam: 'Scam or fraud',
  other: 'Something else',
};

export const DETAILS_MAX = 1000;
export const APPEAL_MIN = 10;
export const APPEAL_MAX = 1000;

export const reportSchema = z.object({
  category: z.enum(REPORT_CATEGORIES, { message: 'Choose the reason that fits best' }),
  details: z
    .string()
    .trim()
    .max(DETAILS_MAX, `Keep details under ${DETAILS_MAX} characters`)
    .optional(),
  evidenceNote: z
    .string()
    .trim()
    .max(DETAILS_MAX, `Keep the note under ${DETAILS_MAX} characters`)
    .optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const appealSchema = z.object({
  message: z
    .string()
    .trim()
    .min(APPEAL_MIN, `Tell us why at least ${APPEAL_MIN} characters`)
    .max(APPEAL_MAX, `Keep it under ${APPEAL_MAX} characters`),
});

// Plain-language names for moderation decisions, shown in notices.
export const ACTION_LABELS: Record<'warn' | 'restrict' | 'suspend' | 'ban', string> = {
  warn: 'Warning',
  restrict: 'Limited account',
  suspend: 'Account suspended',
  ban: 'Account removed',
};

// Only real decisions can be appealed. A dismissed report is not a decision about the person.
export function canAppeal(action: string, hasAppeal: boolean): boolean {
  return action !== 'dismiss' && !hasAppeal;
}

// A suspension is active until its end time; a ban has no end time.
export function describeUntil(until: string | null): string | null {
  if (!until) return null;
  const date = new Date(until);
  if (Number.isNaN(date.getTime())) return null;
  return `Until ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}
