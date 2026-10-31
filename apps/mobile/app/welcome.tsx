import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';

// Welcome screen. One entry point: sign-in and sign-up are the same phone-number flow.
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
        <Button label="Continue with mobile number" onPress={() => router.push('/(auth)/phone')} />
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
  legal: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm },
});
