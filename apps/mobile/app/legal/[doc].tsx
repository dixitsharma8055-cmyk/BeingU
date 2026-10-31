import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import { findLegalDoc } from '@/legal/content';

// Shows one legal document. Until counsel has reviewed the text, the banner says so.
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const found = findLegalDoc(String(doc));

  if (!found) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>Document not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: found.title, headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>Draft. Not yet reviewed by a lawyer. Do not rely on this text as final.</Text>
        </View>
        <Text style={styles.heading}>{found.title}</Text>
        {found.sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{s.heading}</Text>
            {s.paragraphs.map((p, i) => (
              <Text key={i} style={styles.body}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  banner: { backgroundColor: colors.highlightSoft, borderRadius: radius.md, padding: spacing.md },
  bannerText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  heading: { fontSize: 24, fontWeight: '700', color: colors.ink },
  section: { gap: spacing.sm },
  sectionHeading: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
});
