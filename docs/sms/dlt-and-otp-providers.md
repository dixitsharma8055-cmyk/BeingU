# India SMS for OTP: DLT checklist and provider comparison

**Status: checklist and comparison only. Nothing has been registered or purchased.** Prices and operator procedures change, so check each provider's current terms and quote before you commit.

## Why DLT matters
Under India's telecom rules, SMS to Indian mobile numbers must come from a registered sender and use registered message templates. Twilio's API expects the registration IDs on each India message. A missing or mismatched ID is rejected (Twilio errors 21900 for the Principal Entity ID and 21901 for the template ID).

## Checklist: what you need
Registration runs through a telecom operator's DLT portal and is usually completed by a business account holder.

| Item | Needed for | Notes |
|---|---|---|
| Company registration documents (incorporation or registration certificate) | Principal Entity (PE) registration | Your company's own documents |
| PAN of the entity | PE registration | Entity PAN |
| GST registration (if applicable) | PE registration | Confirm whether required for your entity |
| Registered address and proof of address | PE registration | Must match the company documents |
| Authorised signatory details and ID | PE registration | The person who signs the registration |
| Business website and support email | PE registration | Use a monitored address |
| **Sender header** (the short ID shown as the sender) | Every SMS | Usually six characters; confirm the format with the operator. Pick a name that is clearly BeingU. |
| **OTP message template** with placeholders | Every OTP | Must match an approved template word for word. Example shape: `<code> is your BeingU verification code. Do not share it with anyone. -<HEADER>` (exact wording is decided during registration) |
| PE ID and template ID | Each API send | Store as backend configuration, not in the app |

## Steps
1. Choose the sender header and draft the OTP template (no marketing text in an OTP template).
2. Register the Principal Entity on a DLT platform through a telecom operator.
3. Register the sender header and OTP template against the PE.
4. Wait for approval (the timing varies by operator).
5. Configure the PE ID and template IDs in the SMS provider, so each OTP is sent with the correct IDs.
6. Send one test to your own number.

## Provider comparison (to confirm before choosing)
| | Twilio | MSG91 | Exotel |
|---|---|---|---|
| Focus | Global platform; already configured for BeingU | India-focused messaging and OTP | India-focused communications (SMS and voice) |
| India DLT | Needs PE and template IDs per message (documented error codes) | Built around DLT for Indian traffic | Supports Indian SMS compliance; confirm the DLT flow |
| Already integrated | Yes, through Supabase Auth settings | No | No |
| Cost | Per-message rates for India; get the current rate card | Get the current rate card | Get the current rate card |
| Things to check | Whether the Supabase phone flow sends the DLT IDs for India; whether it uses Verify or Messaging | DLT onboarding help; Supabase compatibility | Supabase compatibility; DLT flow |

**Recommendation for now:** keep Twilio (already configured) and confirm it can send DLT-registered OTP messages to Indian numbers before spending anything. Compare MSG91 only if Twilio's India route is unreliable or too expensive. I have not verified any provider's current price.

## Approval needed before any spend
- Upgrading or buying credits (Twilio or another provider)
- Any test SMS that costs money
- Registration fees charged by the operator or the DLT platform, if any
