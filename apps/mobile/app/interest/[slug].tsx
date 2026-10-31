import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { InterestChip } from '@/components/InterestChip';
import { colors, radius, spacing } from '@/constants/theme';
import {
  fetchInterestBySlug,
  fetchInterestPeople,
  fetchRelatedInterests,
  PEOPLE_PAGE_SIZE,
  type InterestDetail,
  type InterestPerson,
  type RelatedInterest,
} from '@/lib/interestPage';
import { supabase } from '@/lib/supabase';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; interest: InterestDetail; people: InterestPerson[]; related: RelatedInterest[] };

// One interest's discovery page: the people who share it (public profiles only) and related interests.
export default function InterestScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/welcome');
        return;
      }
      const interest = await fetchInterestBySlug(String(slug));
      if (!interest) {
        setState({ status: 'not-found' });
        return;
      }
      const [people, related] = await Promise.all([
        fetchInterestPeople(interest.id, userData.user.id),
        fetchRelatedInterests(interest.category_id, interest.id),
      ]);
      setState({ status: 'ready', interest, people, related });
    } catch {
      setState({ status: 'error' });
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (state.status === 'not-found') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.heading}>Interest not found</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>We could not load this interest</Text>
        <Button label="Try again" onPress={load} />
      </View>
    );
  }

  const { interest, people, related } = state;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: interest.name_en, headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />

      <View style={styles.header}>
        <Text style={styles.category}>{interest.category_name}</Text>
        <Text style={styles.heading}>{interest.name_en}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People into {interest.name_en}</Text>
        {people.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.body}>
              No one else has picked this yet. People appear here when their profile is public. Your profile stays private unless you make it public.
            </Text>
          </View>
        ) : (
          <>
            {people.map((p) => (
              <View
                key={p.id}
                accessible
                accessibilityLabel={`${p.display_name}, @${p.username}${p.state_name ? `, ${p.state_name}` : ''}`}
                style={styles.person}
              >
                <Text style={styles.personName}>{p.display_name}</Text>
                <Text style={styles.personMeta}>
                  @{p.username}
                  {p.state_name ? ` · ${p.state_name}` : ''}
                </Text>
              </View>
            ))}
            {people.length >= PEOPLE_PAGE_SIZE ? (
              <Text style={styles.hint}>Showing the first {PEOPLE_PAGE_SIZE} people.</Text>
            ) : null}
          </>
        )}
      </View>

      {related.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related interests</Text>
          <View style={styles.chips}>
            {related.map((r) => (
              <InterestChip key={r.id} label={r.name_en} selected={false} onPress={() => router.push(`/interest/${r.slug}`)} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  header: { gap: 4 },
  category: { fontSize: 13, color: colors.purple, fontWeight: '700', textTransform: 'uppercase' },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  hint: { fontSize: 13, color: colors.inkMuted },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  empty: { borderWidth: 1, borderColor: colors.inkMuted, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.white },
  person: { borderWidth: 1, borderColor: colors.inkMuted, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.white, gap: 2 },
  personName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  personMeta: { fontSize: 13, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
