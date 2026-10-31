import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { sharedLabel } from '@/lib/interestRules';
import { fetchDiscover, type DiscoverPerson } from '@/lib/discover';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; people: DiscoverPerson[] };

// Discover: public people who share your interests. Each card says what you have in common.
export default function DiscoverScreen() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', people: await fetchDiscover() });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Discover', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
      {state.status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} />
        </View>
      ) : state.status === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.heading}>We could not load people right now</Text>
          <Button label="Try again" onPress={load} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.body}>
            People with public profiles who share your interests. Most shared first.
          </Text>
          {state.people.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.heading}>No matches yet</Text>
              <Text style={styles.body}>
                Discover shows people with public profiles who share an interest with you. Add more interests, or make your profile public, to be found.
              </Text>
              <Button label="Edit my profile" variant="secondary" onPress={() => router.push('/profile')} />
            </View>
          ) : (
            state.people.map((p) => (
              <Pressable
                key={p.userId}
                accessibilityRole="button"
                accessibilityLabel={`${p.displayName}, @${p.username}. ${sharedLabel(p.sharedNames)}. Open profile`}
                onPress={() => router.push(`/user/${p.username}`)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.name}>{p.displayName}</Text>
                <Text style={styles.meta}>
                  @{p.username}
                  {p.stateName ? ` · ${p.stateName}` : ''}
                </Text>
                <Text style={styles.shared}>{sharedLabel(p.sharedNames)}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  empty: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.inkMuted, backgroundColor: colors.white },
  card: { borderWidth: 1, borderColor: colors.inkMuted, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.white, gap: 3 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.inkMuted },
  shared: { fontSize: 14, color: colors.purple, fontWeight: '600', marginTop: 4 },
});
