# BeingU

Interest-based social networking platform. Your Vibe. Your Tribe.

## Repository layout
- `apps/mobile/` — the Expo (React Native) app for Android and iOS.
- `supabase/` — database migrations (with Row Level Security) and seed data. Not yet applied to any project.
- `docs/` — architecture and decisions, in plain language.
- `CLAUDE.md` — engineering rules and progress. Read it first.

## Reviewing the current work (no terminal needed)
1. Open the repository on GitHub and switch to the branch **`feature/phase1-foundation`**.
2. Start with `CLAUDE.md` (rules and progress), then `docs/architecture.md`.
3. Check the splash and welcome screens in `apps/mobile/app/`.
4. Check the database rules in `supabase/migrations/0001_foundation.sql`.
5. Do not merge to `main` until the checks listed in `CLAUDE.md` are complete.

## Setting up (when a computer with a terminal is available)
1. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.
2. In `apps/mobile`, run `npm install`, then `npm start`.
3. Never commit `.env`.

## Environment limits (current cloud workspace)
- The npm package registry was refused by the workspace's network policy, so dependencies could not be installed and the TypeScript check and tests could not be run here.
- Pushing to GitHub requires linking the GitHub account to this session.
