import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, gradients, radius, spacing } from '@/constants/theme';

// Welcome screen. Both buttons open real screens; the sign-up and log-in screens are placeholders
// until the authentication step is built (see CLAUDE.md progress list).
export default function Welcome() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <BrandLogo size={200} />
        <Text style={styles.heading}>Be yourself. Find your people.</Text>
        <Text style={styles.body}>
          Discover your interests, meet people who share them, and belong to communities across India.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create an account"
          onPress={() => router.push('/(auth)/signup')}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Create account</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in to your account"
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>I already have an account</Text>
        </Pressable>
        <Text style={styles.legal}>By continuing you confirm you are 18 or older.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 16, color: colors.inkMuted, textAlign: 'center', lineHeight: 22 },
  actions: { gap: spacing.sm, paddingBottom: spacing.lg },
  primary: { backgroundColor: colors.purple, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondary: { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.ink },
  secondaryText: { color: colors.ink, fontSize: 17, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  legal: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm },
});
