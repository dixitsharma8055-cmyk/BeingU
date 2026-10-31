import { z } from 'zod';
import { isAdult } from './phone';

// Usernames: 3-30 characters, lower-case letters, digits, underscore or dot. Matches the database rule.
const USERNAME = /^[a-z0-9_.]{3,30}$/;

// Accepts DD/MM/YYYY (how people write dates in India) and returns a Date, or null if the date is not real.
export function parseIndianDate(input: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  // Reject dates that rolled over, such as 31/02/2000.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

// Stored format for the database: YYYY-MM-DD.
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const profileSchema = z.object({
  displayName: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Enter your name').max(60, 'Name must be 60 characters or fewer')),
  username: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().regex(USERNAME, 'Use 3-30 letters, numbers, dots or underscores')),
  dateOfBirth: z
    .string()
    .transform((s) => parseIndianDate(s))
    .pipe(
      z
        .custom<Date>((v) => v instanceof Date, 'Enter your date of birth as DD/MM/YYYY')
        .refine((d) => isAdult(d), 'BeingU is for people aged 18 and above'),
    ),
  bio: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(300, 'Bio must be 300 characters or fewer')),
  stateId: z.string().nullable(),
});

export type ProfileInput = {
  displayName: string;
  username: string;
  dateOfBirth: string;
  bio: string;
  stateId: string | null;
};

// Turns a validated form into the row we save. Only fields the user controls are included.
export function toProfileRow(userId: string, input: ProfileInput) {
  const parsed = profileSchema.parse({ ...input, stateId: input.stateId });
  return {
    id: userId,
    display_name: parsed.displayName,
    username: parsed.username,
    date_of_birth: toIsoDate(parsed.dateOfBirth),
    bio: parsed.bio || null,
    state_uts_id: parsed.stateId,
  };
}
