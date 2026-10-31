# BeingU — Project Instructions (single source of truth for engineering)

## Product
- Name: BeingU. Tagline: "Your Vibe. Your Tribe." Philosophy: "Be yourself. Find your people."
- Interest-based social network for adults aged 18+.
- Pillars: Express, Discover, Belong. Interest pages are the core discovery gateway.
- Dating is NOT in the MVP. Any future dating feature: separate, opt-in, adult-only, with consent and its own privacy controls.

## Market (India first, nationwide)
- Launch across ALL of India. Do not restrict registration or access by city or state.
- Supabase: ONE primary project hosted in Mumbai (ap-south-1). Do not create per-state projects.
- Phone authentication with +91 Indian mobile numbers.
- Location: all 28 states and 8 union territories (seeded); cities and towns imported in a later step.
- Discovery filters by city and by state. Location sharing is optional, off by default, and privacy-controlled.
- Currency: INR (₹) wherever money appears.
- Languages: English and Hindi at launch. The database and UI strings must be designed for adding more Indian languages (store text keys, not hard-coded strings).
- Future: international expansion. Keep country as a future dimension; do not hard-code India-only assumptions into the schema.

## Brand
- Official logo: `apps/mobile/assets/brand/beingu-logo-original.png` (1254×1254 RGB, sha256 300687fab4a781f2ba5d8d80ca1284b9f43252b5461bc081c4d5617937319c9c).
  - Never redraw, recolour, stretch, crop, or replace it with AI art or text.
  - Derived assets (app icon, splash) must be generated from this file without distortion and documented.
- Colours (sampled from the logo, see `apps/mobile/constants/theme.ts`):
  - background `#FEFCF9`, ink `#11041A`, purple `#A465E2`, pink `#F07095`, orange `#FEAB65`, lilac `#D18FFC`.
- Fonts: Plus Jakarta Sans (headings), Inter (body).

## Stack
- Mobile: React Native + Expo + TypeScript + Expo Router. Styling via a simple token file (`constants/theme.ts`) for now.
- Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions).
- Validation: Zod. Client state: Zustand. Server state: TanStack Query.
- Admin/web (later phase): Next.js + TypeScript.
- Analytics and crashes (later): PostHog, Sentry.

## Security and privacy rules (non-negotiable)
1. Authorisation is enforced in the database (Row Level Security) and the backend, never only in the UI.
2. Admin permissions are never a client-side flag. Admin actions are logged.
3. Secrets are never committed. Use environment variables. `.env.example` holds placeholders only.
4. The Supabase service role key never ships in the mobile app or the web bundle.
5. Exact home addresses and precise live locations are never shown to other users.
6. Do not infer sensitive personal attributes. Do not claim personality or psychological compatibility in recommendations. Recommendation reasons must be explainable.
7. Adults only: date of birth is enforced in the database (trigger), not only in the app.
8. Account deletion goes through a server-side function that removes the auth user and its data.

## Engineering rules
1. Build real, backend-connected features. No fake buttons that do nothing. Placeholders must be clearly labelled.
2. No hard-coded demo data as permanent application data.
3. Validate all inputs (Zod on the client, constraints in the database).
4. Use reusable components. Do not put the whole app in one file.
5. Keep TypeScript strict.
6. Do not claim a feature works until it has been run and tested. Report honestly what was and was not run.
7. Do not apply destructive database changes (DROP, DELETE, TRUNCATE) without explicit founder approval.
8. Ask before incurring paid third-party costs, or using credentials the founder has not supplied.
9. Mobile experience is the top priority.
10. Keep `docs/` up to date when architecture decisions change.

## Git workflow
- Never push directly to `main`. Work on a feature branch (e.g. `feature/phase1-foundation`) and open a pull request for review.
- Commit messages are short and in the imperative mood.

## Open decisions (awaiting the founder)
- Is BeingU a new product, or a rename of VIBELY (existing notes describe a Next.js web app)?
- Supabase project (Mumbai, ap-south-1): URL and anon key, supplied as environment variables only.
- Expo / EAS account and whether to use paid services (EAS builds, Sentry, PostHog plans).
- Confirm the npm registry and GitHub push access for this cloud workspace (see README "Environment limits").

## Progress
- [x] Original logo stored unmodified in `apps/mobile/assets/brand/`.
- [x] Repository cloned; feature branch `feature/phase1-foundation` created.
- [x] `.gitignore` and `.env.example` (secrets excluded).
- [x] Design tokens from the logo (`apps/mobile/constants/theme.ts`).
- [x] Splash screen (logo), welcome screen, root navigation, auth placeholders.
- [x] Supabase client with validated environment variables.
- [x] Foundation migration with RLS (`supabase/migrations/0001_foundation.sql`), NOT applied.
- [x] Seed: 28 states and 8 union territories (`supabase/seed.sql`), NOT applied.
- [ ] Install dependencies and run TypeScript check (blocked: npm registry unreachable from this workspace).
- [x] Phone (+91) sign-up/log-in with one-time code: phone entry, code entry, 18+ and terms consent (`apps/mobile/app/(auth)/`). Code written; NOT yet run on a device or against Supabase.
- [x] Phone and age logic checked offline (19 checks passing, using a stand-in for zod). Jest test file written in `apps/mobile/__tests__/` but NOT run.
- [ ] Install dependencies, run `npm test` and `npm run typecheck`.
- [ ] Supabase phone provider with an SMS provider configured (costs money; founder approval needed).
- [ ] DLT registration for OTP SMS in India (required by TRAI for SMS to Indian numbers).
- [ ] Counsel review of the legal documents and filling of all placeholders (launch blocker).
- [x] Onboarding profile step (name, username, date of birth, bio, state). Code written; checks passing offline.
- [x] Interest library: 520 interests in 26 categories, generated from `supabase/data/interests.json` (migration 0002).
- [x] Interest selection: search, category filter, 3–20 limit, skill level, favourite, want-to-learn, custom interests (unapproved until reviewed). Migration 0003 saves all-or-nothing.
- [x] Database security tests (23 checks) pass on a local PostgreSQL 16 with a Supabase stub: `supabase/tests/run_local.sh`.
- [x] Terms, Privacy Policy and Community Guidelines drafted (`apps/mobile/legal/content.ts`), shown in-app with a draft banner. NOT reviewed by counsel; see `docs/legal/README.md` for the placeholders to fill.
- [x] Own profile screen (`apps/mobile/app/profile/`) shows interest badges, favourites first, and a 'want to learn' section. Editing interests returns to the profile.
- [x] Blocking and reporting: database (migration 0006, 70 local checks pass), block/unblock, report form with seven categories, blocked-people list, notices with one appeal per decision. Code written; NOT run on a device; Jest tests written but NOT run (npm registry unreachable from this workspace).
- [ ] `apps/mobile/package.json` now declares dependencies (Expo SDK 52 set) but the versions are UNVERIFIED: the npm registry was unreachable. Run `npx expo install --fix` and `npm install` with network access, then fix any mismatch before typecheck and tests.
- [ ] Interest badges are not tappable yet: interest pages come with discovery.
- [ ] Other users' profiles, profile photo and city selection are not built.
- [ ] Hindi names for interests and categories are empty (`name_hi` null); translation pending.
- [ ] City list import.
- [ ] Hindi translations.
