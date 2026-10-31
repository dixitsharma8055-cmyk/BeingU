import { z } from 'zod';

// Validates the public Supabase settings at startup so a missing value fails loudly
// with a clear message, instead of producing confusing errors later.
const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL must be a full https URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'EXPO_PUBLIC_SUPABASE_ANON_KEY looks too short'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `- ${i.message}`).join('\n');
    throw new Error(`BeingU configuration is incomplete. Copy .env.example to .env and fill in:\n${problems}`);
  }
  return result.data;
}
