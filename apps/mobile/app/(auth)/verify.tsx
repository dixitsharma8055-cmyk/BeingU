import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { otpSchema, toE164 } from '@/lib/phone';
import { supabase } from '@/lib/supabase';

const RESEND_SECONDS = 30;

// Step 2: enter the 6-digit code. On success the user is signed in and moves to onboarding.
export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  if (!phone) {
    // Opened without a phone number (for example from a stale link). Send the user back to start.
    return <Text style={styles.body}>Something went wrong. Please start again.</Text>;
  }
  const e164 = toE164(phone);

  async function verify() {
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter the 6-digit code');
      return;
    }
    setError(null);
    setVerifying(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: e164, token: parsed.data, type: 'sms' });
    setVerifying(false);

    if (verifyError) {
      setError('That code is not right or has expired. Try again or request a new one.');
      return;
    }
    // Signed in. Onboarding (name, username, date of birth, interests) comes next.
    router.replace('/(onboarding)');
  }

  async function resend() {
    setResending(true);
    const { error: resendError } = await supabase.auth.signInWithOtp({ phone: e164, options: { channel: 'sms' } });
    setResending(false);
    if (resendError) {
      Alert.alert('Could not send a new code', 'Please try again in a minute.');
      return;
    }
    setSecondsLeft(RESEND_SECONDS);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Enter your code</Text>
        <Text style={styles.body}>We sent a 6-digit code to {e164}.</Text>

        <TextField
          label="6-digit code"
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, ''));
            if (error) setError(null);
          }}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          maxLength={6}
          error={error}
        />

        <Button label="Verify" onPress={verify} disabled={code.length !== 6} loading={verifying} />

        <Button
          label={secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
          variant="secondary"
          onPress={resend}
          disabled={secondsLeft > 0}
          loading={resending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
