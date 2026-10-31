import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { COUNTRY_CODE, indianMobileSchema, toE164 } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

// Step 1 of sign-up/log-in: the user confirms they are 18+ and accepts the terms,
// then enters a +91 mobile number and receives a one-time code.
export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sending, setSending] = useState(false);

  const canContinue = isAdult && acceptedTerms && phone.trim().length > 0 && !sending;

  async function sendCode() {
    const parsed = indianMobileSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid mobile number');
      return;
    }
    setError(null);
    setSending(true);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      phone: toE164(parsed.data),
      options: { channel: 'sms' },
    });
    setSending(false);

    if (sendError) {
      // Show a safe, general message. Never show raw provider errors to users.
      Alert.alert('Could not send the code', 'Please check the number and try again in a minute.');
      return;
    }
    router.push({ pathname: '/(auth)/verify', params: { phone: parsed.data } });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <BrandLogo size={120} />
        </View>

        <Text style={styles.heading}>Let's get you in</Text>
        <Text style={styles.body}>We'll send a one-time code to your mobile number. No password needed.</Text>

        <TextField
          label="Mobile number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (error) setError(null);
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder={`${COUNTRY_CODE} 98765 43210`}
          maxLength={18}
          error={error}
        />

        <View style={styles.consents}>
          <Checkbox checked={isAdult} onChange={setIsAdult}>
            I confirm I am 18 years of age or older.
          </Checkbox>
          <Checkbox checked={acceptedTerms} onChange={setAcceptedTerms}>
            I agree to the Terms and Conditions and the Privacy Policy.
          </Checkbox>
          <View style={styles.links}>
            <Pressable accessibilityRole="link" accessibilityLabel="Read the Terms and Conditions" onPress={() => router.push('/legal/terms')}>
              <Text style={styles.link}>Read Terms</Text>
            </Pressable>
            <Pressable accessibilityRole="link" accessibilityLabel="Read the Privacy Policy" onPress={() => router.push('/legal/privacy')}>
              <Text style={styles.link}>Read Privacy Policy</Text>
            </Pressable>
            <Pressable accessibilityRole="link" accessibilityLabel="Read the Community Guidelines" onPress={() => router.push('/legal/community')}>
              <Text style={styles.link}>Community Guidelines</Text>
            </Pressable>
          </View>
        </View>

        <Button label="Send code" onPress={sendCode} disabled={!canContinue} loading={sending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  logo: { alignItems: 'center' },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
  consents: { gap: spacing.md, marginTop: spacing.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginLeft: 30 },
  link: { fontSize: 14, color: colors.purple, fontWeight: '600', textDecorationLine: 'underline' },
});
