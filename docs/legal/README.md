# Legal documents: review notes for counsel

**Status: DRAFT. Not reviewed by a lawyer. Do not publish as final.**

The text lives in `apps/mobile/legal/content.ts` (six documents: Terms, Privacy, Community Guidelines, Content Moderation, Account Deletion, Advertising). The company details you must supply are listed in `docs/legal/information-checklist.md` and is shown in the app from the sign-in screen. This file lists what counsel must confirm before launch.

## Placeholders to fill in (launch is blocked until all are replaced)
| Placeholder | Where | What to put |
|---|---|---|
| `[COMPANY LEGAL NAME]` | Terms, Privacy | The registered entity that operates BeingU |
| `[GRIEVANCE OFFICER NAME AND DESIGNATION]` | Terms, Privacy | The person named under the IT Rules 2021 |
| `[GRIEVANCE OFFICER EMAIL]` | Terms, Privacy | A monitored address |
| `[CITY WHERE COURTS ARE LOCATED]` | Terms | The jurisdiction for disputes |
| `[DATE OF PUBLICATION]` | Terms, Privacy | The date the final text is published |
| `[COUNSEL TO CONFIRM: ...]` | Privacy, section 6 | Every service provider that processes data outside India, and the safeguards used |
| `[COUNSEL TO SET RETENTION PERIODS ...]` | Privacy, section 7 | Retention for logs and reports |

## Points for counsel to verify
1. **DPDP Act, 2023 and the DPDP Rules.** The Rules were notified in November 2025 and are being phased in over roughly 12 to 18 months. Confirm which obligations apply on the launch date: notice, consent, withdrawal, rights requests, breach notification, and the Data Protection Board process.
2. **Consent wording.** Confirm that the sign-in consents meet the DPDP notice-and-consent requirements, and whether analytics (PostHog) needs a separate, optional consent.
3. **Intermediary obligations under the IT Rules 2021 (as amended).** Confirm the grievance-redressal timelines, takedown rules, and any reporting duties that apply to a social platform. The current draft avoids stating hour or day limits and says "within the time limits required by Indian law".
4. **Age assurance.** The app restricts use to 18+ by self-declaration and a date-of-birth check. Confirm whether this is adequate, or whether more is needed.
5. **Data location.** The database is planned for Mumbai. Confirm rules for every processor (SMS, error tracking, analytics) and any cross-border transfer.
6. **Community guidelines.** Confirm the wording on reporting, appeals and enforcement, and that the moderation process matches what the product actually does.
7. **Google Play and Apple App Store.** Confirm the account-deletion and privacy-label requirements for each store.

## Sources checked while drafting (not legal advice)
- DPDP Rules notification and phased timeline: [Deccan Herald](https://www.deccanherald.com/amp/story/india%2Fcentre-notifies-dpdp-rules-implementation-planned-in-phases-spread-over-12-18-months-3798465) and [AZB & Partners](https://www.azbpartners.com/bank/indias-digital-personal-data-protection-act-phased-rollout-and-key-compliance-milestones/)

## Release checklist
- [ ] Every placeholder above is replaced, and `npm test` (legal.test.ts) passes
- [ ] Counsel has signed off on each document, with the date and reviewer recorded here
- [ ] The "Draft" banner in `apps/mobile/app/legal/[doc].tsx` is removed
- [ ] Store listings link to the final Privacy Policy
