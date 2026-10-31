# BeingU architecture (Phase 1)

## Plain-language summary
- The **app** (what people install on their phone) is built with Expo, which lets one codebase run on Android and iPhone.
- The **backend** is Supabase: it holds accounts, profiles, interests and, later, posts and messages. It is hosted in Mumbai to keep data in India.
- **Row Level Security** is a rule book inside the database that says who may read or change each row. Even if someone bypasses the app, the database still refuses.

## Layers
| Layer | Technology | Location in repo |
|---|---|---|
| Mobile app | Expo, React Native, TypeScript, Expo Router | `apps/mobile/` |
| Brand assets | Original logo, unmodified | `apps/mobile/assets/brand/` |
| Design tokens | Colours, spacing, fonts | `apps/mobile/constants/theme.ts` |
| Backend data | Postgres migrations, RLS, seeds | `supabase/` |
| Docs | Architecture and decisions | `docs/` |

## Decisions
1. **One Supabase project in Mumbai.** Simpler to run, cheaper, and nationwide by design. No per-state projects.
2. **Locations are data, not code.** States, union territories and cities are rows in tables, so new towns can be added without an app update.
3. **Language is data.** Interest names carry `name_en` and `name_hi`; more languages can be added as columns or a translation table later.
4. **18+ is enforced in the database.** A trigger rejects under-18 dates of birth.
5. **Exact addresses are never stored** in profiles. Only a state and city are stored, and visibility defaults to hidden.
6. **Profiles default to private.** Users opt in to public visibility.
7. **Phone (+91) authentication** will be wired in the authentication step.

## Not yet built
- Authentication flows, onboarding, profile editing, feeds, communities, messaging, admin dashboard, notifications, analytics.
