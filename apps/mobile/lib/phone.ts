import { z } from 'zod';

// Indian mobile numbers: exactly 10 digits, starting with 6, 7, 8 or 9.
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export const COUNTRY_CODE = '+91';

// Accepts what people actually type: "98765 43210", "+91 98765-43210", "09876543210", "919876543210".
// Returns just the 10-digit national number (or the cleaned input if it cannot be fixed).
export function toNationalNumber(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export const indianMobileSchema = z
  .string()
  .transform(toNationalNumber)
  .pipe(z.string().regex(INDIAN_MOBILE, 'Enter a valid 10-digit Indian mobile number'));

// Supabase needs the full international form, e.g. +919876543210.
export function toE164(nationalNumber: string): string {
  return `${COUNTRY_CODE}${nationalNumber}`;
}

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'Enter the 6-digit code we sent you');

// Returns the age in whole years on the given date (default: today).
export function ageOn(dateOfBirth: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

export function isAdult(dateOfBirth: Date, today: Date = new Date()): boolean {
  return ageOn(dateOfBirth, today) >= 18;
}
