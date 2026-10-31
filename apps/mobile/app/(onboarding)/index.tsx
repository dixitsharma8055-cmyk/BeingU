import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

// Placeholder: name, username, date of birth, photo and interests are built in the next phase.
export default function OnboardingPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>You're signed in</Text>
      <Text style={styles.body}>Profile setup (name, username, date of birth and interests) is the next step to build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
