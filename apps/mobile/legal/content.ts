// BeingU legal text. DRAFT: written to be reviewed by qualified Indian counsel before launch.
// Placeholders are written in [SQUARE BRACKETS] and must be replaced. Launch is blocked until none remain
// (see docs/legal/README.md). Not legal advice on its own.

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDoc = {
  slug: 'terms' | 'privacy' | 'community' | 'moderation' | 'deletion' | 'advertising';
  title: string;
  sections: LegalSection[];
};

export const LAST_UPDATED = '[DATE OF PUBLICATION]';
export const COMPANY = '[COMPANY LEGAL NAME]';
export const GRIEVANCE_EMAIL = '[GRIEVANCE OFFICER EMAIL]';
export const GRIEVANCE_OFFICER = '[GRIEVANCE OFFICER NAME AND DESIGNATION]';
export const JURISDICTION = '[CITY WHERE COURTS ARE LOCATED]';

export const termsDoc: LegalDoc = {
  slug: 'terms',
  title: 'Terms and Conditions',
  sections: [
    {
      heading: '1. Who we are',
      paragraphs: [
        `BeingU is an interest-based social networking service operated by ${COMPANY}. These terms form an agreement between you and us when you create an account or use BeingU.`,
      ],
    },
    {
      heading: '2. Who can use BeingU',
      paragraphs: [
        'BeingU is only for people aged 18 years or older. By creating an account you confirm that you are 18 or older and that the date of birth you give is correct.',
        'We check age when you sign up and may ask you to confirm it again. If we find that an account belongs to someone under 18, we will close it.',
      ],
    },
    {
      heading: '3. Your account',
      paragraphs: [
        'You sign in with your mobile number, using a one-time code. You are responsible for keeping access to your phone and account secure.',
        'You must give accurate information and keep it up to date. You may have one personal account. You may not impersonate another person or organisation.',
      ],
    },
    {
      heading: '4. Your content',
      paragraphs: [
        'You keep ownership of what you post, such as photos, videos, text, polls and comments.',
        'You give BeingU a non-exclusive, worldwide, royalty-free licence to host, store, display and distribute your content only as needed to run the service for you and the people you share it with. You can delete your content at any time.',
      ],
    },
    {
      heading: '5. Rules for using BeingU',
      paragraphs: [
        'You agree to follow our Community Guidelines. You must not harass, threaten, or abuse others; post sexual content involving minors or non-consensual intimate content; spread hate; send spam; create fake engagement; or use BeingU for unlawful activity.',
      ],
    },
    {
      heading: '6. Reporting, moderation and appeals',
      paragraphs: [
        'You can report posts, comments, messages, communities and accounts inside the app. We review reports and may remove content, limit features, or suspend accounts.',
        'If we act against your content or account, we will tell you the reason where the law allows, and you may appeal through the in-app process or by contacting our grievance officer.',
      ],
    },
    {
      heading: '7. Ending your account',
      paragraphs: [
        'You can delete your account at any time from Settings. Deletion removes your profile and personal data as described in our Privacy Policy, subject to any records we must keep by law.',
        'We may suspend or end your access if you break these terms or the law.',
      ],
    },
    {
      heading: '8. Disclaimers and limits',
      paragraphs: [
        'BeingU is provided as it is. We do not guarantee that you will find friends, partners, or communities. We are not responsible for content posted by other users or for meetings arranged between users. Take care when meeting people in person.',
        'To the extent the law allows, our total liability to you is limited to the amount, if any, you have paid us in the 12 months before the claim.',
      ],
    },
    {
      heading: '9. Changes to these terms',
      paragraphs: [
        'We may update these terms. If changes are significant, we will tell you in the app before they take effect. Continuing to use BeingU after that means you accept them.',
      ],
    },
    {
      heading: '10. Governing law and disputes',
      paragraphs: [
        `These terms are governed by the laws of India. Courts at ${JURISDICTION} have jurisdiction, subject to any mandatory rights you have under Indian law.`,
      ],
    },
    {
      heading: '11. Contact and grievances',
      paragraphs: [
        `For complaints and grievances, contact ${GRIEVANCE_OFFICER} at ${GRIEVANCE_EMAIL}. We will acknowledge complaints and respond within the time limits required by Indian law.`,
        `Last updated: ${LAST_UPDATED}.`,
      ],
    },
  ],
};

export const privacyDoc: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  sections: [
    {
      heading: '1. What this policy covers',
      paragraphs: [
        `This policy explains what personal data ${COMPANY} collects through BeingU, why, and what choices you have. It is written to align with India's Digital Personal Data Protection Act, 2023 and the rules made under it.`,
      ],
    },
    {
      heading: '2. What we collect',
      paragraphs: [
        'Account data: your mobile number, name, username, date of birth, and the state you choose (if any).',
        'Profile data: your bio, photo, interests, skill levels, favourites and what you want to learn.',
        'Content and activity: the posts, comments, messages, reports and likes you create, and basic activity needed to run the service.',
        'Device and security data: app version, device type, and logs used to prevent abuse and fix problems.',
        'Location: only if you turn it on. It is off by default. When on, we use an approximate area, never your exact address or live position, and you can turn it off at any time.',
      ],
    },
    {
      heading: '3. Why we use your data',
      paragraphs: [
        'To create and secure your account, show your profile and feed, connect you with people and communities that share your interests, send notifications you have chosen, keep the service safe, and comply with the law.',
        'We do not sell your personal data, and we do not use it to infer sensitive attributes such as religion, health, or sexual orientation.',
      ],
    },
    {
      heading: '4. Your consent',
      paragraphs: [
        'We ask for your consent when you sign up and when you choose optional features, such as location or analytics. You can withdraw consent at any time in Settings. Withdrawing consent may mean we can no longer provide some features.',
      ],
    },
    {
      heading: '5. Who we share data with',
      paragraphs: [
        'Service providers that help us run BeingU, such as our database and storage host (hosted in Mumbai, India), our SMS provider for one-time codes, and our crash-reporting and analytics tools. They may process data only on our instructions.',
        'Other users see only what your privacy settings allow. Exact addresses and live locations are never shown to other users.',
        'We may disclose data when required by law or a lawful order.',
      ],
    },
    {
      heading: '6. Where data is stored',
      paragraphs: [
        'Our primary database is hosted in India. [COUNSEL TO CONFIRM: list any service providers that process data outside India, and the safeguards used.]',
      ],
    },
    {
      heading: '7. How long we keep data',
      paragraphs: [
        'We keep your data while your account is active. When you delete your account, we delete your profile and personal data, except where we must keep records for legal, security or dispute reasons. [COUNSEL TO SET RETENTION PERIODS FOR LOGS AND REPORTS.]',
      ],
    },
    {
      heading: '8. Security',
      paragraphs: [
        'We use encryption in transit, access controls that restrict each person to their own data, and regular reviews of our systems. No service is completely secure, so we cannot guarantee absolute security.',
        'If a personal data breach affects you, we will notify you and the authorities as the law requires.',
      ],
    },
    {
      heading: '9. Your rights',
      paragraphs: [
        'You can ask us to access, correct or erase your personal data, and to withdraw consent. You can download or delete your data in Settings. To make a request or complaint, contact our grievance officer.',
      ],
    },
    {
      heading: '10. Children',
      paragraphs: [
        'BeingU is not for anyone under 18. If we learn that we have collected data from someone under 18, we will delete it and close the account.',
      ],
    },
    {
      heading: '11. Changes and contact',
      paragraphs: [
        `We will tell you in the app about significant changes. For questions or complaints, contact ${GRIEVANCE_OFFICER} at ${GRIEVANCE_EMAIL}.`,
        `Last updated: ${LAST_UPDATED}.`,
      ],
    },
  ],
};

export const communityDoc: LegalDoc = {
  slug: 'community',
  title: 'Community Guidelines',
  sections: [
    {
      heading: 'Be yourself. Find your people.',
      paragraphs: [
        'BeingU is for real people sharing real interests. These guidelines explain how to keep it welcoming for everyone.',
      ],
    },
    {
      heading: 'Treat people with respect',
      paragraphs: [
        'No harassment, bullying, threats, stalking, or doxxing. No hate speech or content that attacks people based on religion, caste, region, gender, sexual orientation, disability or other protected characteristics.',
      ],
    },
    {
      heading: 'Keep it safe and legal',
      paragraphs: [
        'No content that sexualises minors, no non-consensual intimate images, no violence or self-harm promotion, no illegal goods or services, and no content that breaks Indian law.',
      ],
    },
    {
      heading: 'Be authentic',
      paragraphs: [
        'Use your own identity. Do not impersonate others or organisations. Do not buy or sell followers, likes or reviews, and do not create fake accounts or engagement.',
      ],
    },
    {
      heading: 'Keep spam out',
      paragraphs: [
        'No unsolicited promotions, repeated messages to people who did not ask, or links designed to trick or harm people.',
      ],
    },
    {
      heading: 'Meeting people in real life',
      paragraphs: [
        'Meetups are organised by people, not by BeingU. Meet in public places, tell someone where you are going, and report anyone who makes you uncomfortable. Never share your home address publicly.',
      ],
    },
    {
      heading: 'Reporting and enforcement',
      paragraphs: [
        'Use the report button on any post, comment, message, community or profile. We review reports and may remove content, limit features or suspend accounts. Repeat or serious violations can lead to permanent removal.',
      ],
    },
  ],
};

export const moderationDoc: LegalDoc = {
  slug: 'moderation',
  title: 'Content Moderation Policy',
  sections: [
    {
      heading: '1. Purpose',
      paragraphs: [
        'This policy explains how BeingU reviews reported content and accounts, what actions we may take, and how you can respond. It applies together with the Community Guidelines and Terms.',
      ],
    },
    {
      heading: '2. How content comes to our attention',
      paragraphs: [
        'Users report posts, comments, messages, communities, and profiles from inside the app. We may also review content that our automated checks flag, such as spam or abusive patterns. Automated checks only prioritise review; a person makes decisions on serious matters.',
      ],
    },
    {
      heading: '3. Report categories',
      paragraphs: [
        'Harassment, bullying, impersonation, spam, inappropriate content, scams, or other. When you report, choose the closest category and, where helpful, add details and evidence. Evidence is kept only for the review and any appeal.',
      ],
    },
    {
      heading: '4. Reviewing reports',
      paragraphs: [
        'Reports are reviewed by trained moderators in order of seriousness. Reports involving child sexual abuse material, credible threats of violence, or self-harm are escalated at once and handled under the law. [COUNSEL TO CONFIRM: escalation route and reporting duties for these categories.]',
      ],
    },
    {
      heading: '5. Possible actions',
      paragraphs: [
        'Depending on the seriousness and history, we may: dismiss the report; ask for the content to be changed; remove content; issue a warning; limit features for a period (restrict); suspend the account for a set period; or permanently ban the account.',
      ],
    },
    {
      heading: '6. Telling you about decisions',
      paragraphs: [
        'When we act against your content or account, we tell you in the app what was done and why, unless the law or a safety reason prevents it. The notice explains how to appeal.',
      ],
    },
    {
      heading: '7. Appeals',
      paragraphs: [
        'You can appeal most actions within [COUNSEL TO SET APPEAL WINDOW] days by sending a short explanation in the app. A different moderator reviews your appeal. We tell you the outcome and the reasons.',
      ],
    },
    {
      heading: '8. Records',
      paragraphs: [
        'We keep a record of reports, decisions and appeals so that actions are consistent and can be audited. Access to these records is limited to authorised staff. [COUNSEL TO SET RETENTION PERIOD FOR MODERATION RECORDS.]',
      ],
    },
    {
      heading: '9. Government and legal requests',
      paragraphs: [
        'We respond to lawful orders from competent authorities. [COUNSEL TO CONFIRM: the grievance and takedown timelines that apply to BeingU under the IT Rules, 2021 (as amended).]',
      ],
    },
  ],
};

export const deletionDoc: LegalDoc = {
  slug: 'deletion',
  title: 'Account Deletion Policy',
  sections: [
    {
      heading: '1. How to delete your account',
      paragraphs: [
        'You can delete your account from Settings. Deletion starts immediately and removes your profile from BeingU. You can also contact our grievance officer if you cannot use the app.',
      ],
    },
    {
      heading: '2. What is deleted',
      paragraphs: [
        'Your profile, name, username, bio, photo, interests, communities you created, posts, comments, messages you sent, and saved items are deleted or made anonymous. Your phone number login is removed.',
      ],
    },
    {
      heading: '3. What we keep, and why',
      paragraphs: [
        'We keep only what the law requires or what is needed to protect other people: records of moderation decisions and appeals, security logs, and any information needed to respond to a legal order. [COUNSEL TO CONFIRM: each category kept, the reason, and how long.]',
      ],
    },
    {
      heading: '4. Messages in other people\'s accounts',
      paragraphs: [
        'Messages you sent may remain visible to the people you sent them to, shown as from a deleted account. We will not show them to anyone else. [PRODUCT TO CONFIRM when messaging is built.]',
      ],
    },
    {
      heading: '5. Timing',
      paragraphs: [
        'Deletion takes effect in the app straight away. Copies in backups are removed when those backups expire, within [COUNSEL TO SET BACKUP PERIOD] days.',
      ],
    },
    {
      heading: '6. Restrictions',
      paragraphs: [
        'If your account is under an active investigation, suspension, or legal hold, deletion may be delayed until that process is complete. You will be told if this applies.',
      ],
    },
    {
      heading: '7. Recovery',
      paragraphs: [
        'Deletion cannot be undone. If you sign up again with the same number, it is a new account with no data from the old one.',
      ],
    },
  ],
};

export const advertisingDoc: LegalDoc = {
  slug: 'advertising',
  title: 'Advertising and Promotions Policy',
  sections: [
    {
      heading: '1. Current status',
      paragraphs: [
        'BeingU does not show advertisements today. This policy applies if and when we introduce advertising, sponsored content, or paid promotions. Before that happens, we will update this policy and tell you in the app.',
      ],
    },
    {
      heading: '2. Labelling',
      paragraphs: [
        'Any paid or sponsored content will be clearly labelled as such, so you can tell it apart from what people share.',
      ],
    },
    {
      heading: '3. What we do not allow',
      paragraphs: [
        'Ads for illegal goods or services; scams or misleading claims; gambling, unless licensed and permitted by law; tobacco and alcohol to under-18s; adult content; and anything that targets people based on health, religion, caste, sexual orientation, or other sensitive attributes.',
      ],
    },
    {
      heading: '4. Targeting',
      paragraphs: [
        'We do not target advertising using sensitive personal data. [COUNSEL TO CONFIRM: rules for using profile interests and state for targeting, and any consent needed under the DPDP Act.]',
      ],
    },
    {
      heading: '5. Advertisers',
      paragraphs: [
        `Advertisers must provide accurate details. ${COMPANY} may refuse or remove any advertising at its discretion. [COUNSEL TO CONFIRM: advertiser agreement and any tax or GST requirements.]`,
      ],
    },
    {
      heading: '6. Contact',
      paragraphs: [
        `For questions about advertising, contact ${GRIEVANCE_EMAIL}.`,
        `Last updated: ${LAST_UPDATED}.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: LegalDoc[] = [termsDoc, privacyDoc, communityDoc, moderationDoc, deletionDoc, advertisingDoc];

export function findLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}

// Every placeholder in the text. Used by tests to make sure none are added silently.
export function allText(): string {
  return LEGAL_DOCS.flatMap((d) => [d.title, ...d.sections.flatMap((s) => [s.heading, ...s.paragraphs])]).join('\n');
}
