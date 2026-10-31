import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/constants/theme';
import { reportPerson } from '@/lib/safety';
import {
  CATEGORY_LABELS,
  DETAILS_MAX,
  REPORT_CATEGORIES,
  reportSchema,
  type ReportCategory,
} from '@/lib/safetyRules';

// Report a person. Reviewed by our moderators; the person you report is not told who reported them.
export default function ReportPersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    const parsed = reportSchema.safeParse({ category, details, evidenceNote });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your report');
      return;
    }
    setSubmitting(true);
    try {
      await reportPerson(String(id), parsed.data);
      Alert.alert('Thank you', 'We have received your report. Our team will review it.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      // The database gives a plain message: already reported, cannot report yourself, and so on.
      setError(e instanceof Error ? e.message : 'We could not send your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: true, title: 'Report', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />

      <Text style={styles.heading}>What is happening?</Text>
      <Text style={styles.body}>Choose the reason that fits best. You can add details to help us understand.</Text>

      <View role="radiogroup" style={styles.categories}>
        {REPORT_CATEGORIES.map((c) => {
          const selected = category === c;
          return (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityLabel={CATEGORY_LABELS[c]}
              accessibilityState={{ checked: selected }}
              onPress={() => setCategory(c)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{CATEGORY_LABELS[c]}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Details (optional)"
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={DETAILS_MAX}
        placeholder="What happened?"
        style={styles.multiline}
      />
      <TextField
        label="Evidence note (optional)"
        value={evidenceNote}
        onChangeText={setEvidenceNote}
        multiline
        maxLength={DETAILS_MAX}
        placeholder="For example: dates, or where you saw it. Do not paste private information about others."
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button label="Send report" onPress={submit} loading={submitting} disabled={!category} />
      <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  categories: { gap: spacing.sm },
  option: { borderWidth: 1.5, borderColor: colors.inkMuted, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.md, backgroundColor: colors.white },
  optionSelected: { borderColor: colors.purple, backgroundColor: colors.highlightSoft },
  optionLabel: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  optionLabelSelected: { color: colors.purple },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { fontSize: 14, color: colors.pink },
});
