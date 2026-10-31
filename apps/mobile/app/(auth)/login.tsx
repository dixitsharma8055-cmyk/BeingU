import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

// Placeholder: the real log-in form is built in the authentication step.
export default function LoginPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.body}>Log-in is being built next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
