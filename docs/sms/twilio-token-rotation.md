# Replacing the exposed Twilio Auth Token (runbook)

**Goal:** stop using the exposed token without any downtime, and without exposing the new one.
**Rule:** the exposed token is revoked only after the replacement has been tested end to end.

## Where credentials live (checked from the build workspace)
- The build workspace holds **no** Twilio or Supabase credentials. Nothing with those names is set here, and nothing is stored in the repository. This is intended.
- The SMS credentials belong in the **Supabase project's Auth settings** (Authentication → Sign In / Providers → Phone, with Twilio selected) and nowhere else. Confirm this in your own dashboard.
- Any Edge Function secret goes in Supabase secrets (`supabase secrets set NAME`). Listing names is safe (`supabase secrets list`), and values must never be printed or pasted into chats.
- Never place a token in `EXPO_PUBLIC_*` variables, the mobile app, GitHub, or `.env` files that get committed.

## Steps, in order
1. **Create the secondary token** in the Twilio Console (you have done this).
2. **Check the secondary token works, without spending money.** On your own computer, with the value held in a variable and never printed:
   ```
   curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_SECONDARY_TOKEN" https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json -o /dev/null -w "%{http_code}\n"
   ```
   Expect `200`. This only reads account details. If you get `401`, stop and check the value. Twilio's docs do not state explicitly that a secondary token authenticates before promotion, so **this test is the proof**. If it fails, do not promote; contact Twilio support.
3. **Update the Supabase phone provider** with the tested secondary token (Authentication → Providers → Phone → Twilio Auth Token). Do not paste the value into any chat.
4. **Send one test OTP to your own number.** This costs a small amount, so it needs your approval. Confirm the code arrives and that the sign-in flow completes.
5. **Promote the secondary token** in the Twilio Console (Auth Tokens → Promote). This deletes the exposed token. Twilio's docs say services that embed the token directly may take about a minute to update, so wait before the next test.
6. **Test once more**, then check Twilio's usage and monitoring logs for anything unexpected since the exposure. If you see activity you do not recognise, contact Twilio support straight away.
7. **Clean up:** remove the old token from every note, chat, screenshot and document you control, and tell me if you ever pasted it anywhere.

## Recommended, not yet verified
- Twilio recommends **API Keys** for applications because they can be scoped and deleted independently. Check whether Supabase's Twilio phone integration accepts an API Key before changing anything.
