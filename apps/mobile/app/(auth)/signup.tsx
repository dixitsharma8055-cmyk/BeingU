import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

// Placeholder: the real sign-up form (mobile number with +91, OTP, 18+ check) is built in the authentication step.
export default function SignUpPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.body}>Sign-up is being built next. It will use your mobile number (+91) to verify your account.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
