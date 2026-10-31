import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/constants/theme';
import { appealDecision, fetchMyNotices, markNoticesSeen, type Notice } from '@/lib/safety';
import { ACTION_LABELS, APPEAL_MAX, APPEAL_MIN, canAppeal, describeUntil } from '@/lib/safetyRules';
import { supabase } from '@/lib/supabase';

const APPEAL_STATUS_TEXT: Record<'open' | 'upheld' | 'overturned', string> = {
  open: 'Your appeal is being reviewed.',
  upheld: 'We reviewed your appeal and the decision stands.',
  overturned: 'We reviewed your appeal and the decision has been reversed.',
};

// Decisions made about your account, with a way to appeal each one once.
export default function NoticesScreen() {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openAppeal, setOpenAppeal] = useState<string | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealError, setAppealError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setNotices(await fetchMyNotices(data.user.id));
      // Opening this screen counts as seeing the decisions, so the badge on your profile clears.
      markNoticesSeen().catch(() => undefined);
    } catch {
      setFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function sendAppeal(actionId: string) {
    setAppealError(null);
    setSending(true);
    try {
      await appealDecision(actionId, appealText);
      setOpenAppeal(null);
      setAppealText('');
      Alert.alert('Appeal sent', 'A different member of our team will review your appeal.');
      load();
    } catch (e) {
      setAppealError(e instanceof Error ? e.message : 'We could not send your appeal. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (failed) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: 'Notices', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
        <Text style={styles.body}>We could not load your notices.</Text>
        <Button label="Try again" onPress={load} />
      </View>
    );
  }
  if (notices === null) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: 'Notices', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Notices', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
      {notices.length === 0 ? <Text style={styles.body}>No decisions about your account.</Text> : null}

      {notices.map((n) => {
        const until = describeUntil(n.until);
        const appealable = canAppeal(n.action, n.appeal_status !== null);
        const editing = openAppeal === n.id;
        const label = ACTION_LABELS[n.action];
        return (
          <View key={n.id} style={styles.card}>
            <Text style={styles.title}>{label}</Text>
            <Text style={styles.date}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            {until ? <Text style={styles.date}>{until}</Text> : null}
            <Text style={styles.reason}>Reason: {n.reason}</Text>

            {n.appeal_status ? <Text style={styles.status}>{APPEAL_STATUS_TEXT[n.appeal_status]}</Text> : null}

            {appealable && !editing ? (
              <Button label="Appeal this decision" variant="secondary" onPress={() => { setOpenAppeal(n.id); setAppealError(null); }} />
            ) : null}

            {appealable && editing ? (
              <View style={styles.appealBox}>
                <TextField
                  label="Why should this be reviewed?"
                  value={appealText}
                  onChangeText={setAppealText}
                  multiline
                  maxLength={APPEAL_MAX}
                  placeholder={`At least ${APPEAL_MIN} characters`}
                  error={appealError}
                  style={styles.multiline}
                />
                <Button label="Send appeal" onPress={() => sendAppeal(n.id)} loading={sending} />
                <Button label="Cancel" variant="secondary" onPress={() => setOpenAppeal(null)} />
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  body: { fontSize: 16, color: colors.inkMuted, textAlign: 'center' },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink },
  date: { fontSize: 13, color: colors.inkMuted },
  reason: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  status: { fontSize: 14, color: colors.purple, fontWeight: '600' },
  appealBox: { gap: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
});
