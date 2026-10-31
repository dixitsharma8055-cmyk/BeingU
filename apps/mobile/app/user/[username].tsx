import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { InterestBadge } from '@/components/InterestBadge';
import { colors, spacing } from '@/constants/theme';
import { commonInterests, splitForProfile, type PickedInterest } from '@/lib/interestRules';
import { fetchInterestsOf, fetchMyInterestIds, fetchPublicProfileByUsername, type PublicProfile } from '@/lib/userProfile';
import { supabase } from '@/lib/supabase';

type State =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; profile: PublicProfile; interests: PickedInterest[]; shared: string[] };

// Another person's profile. Shows what you have in common first. Private profiles show as unavailable.
export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace('/welcome');
        return;
      }
      const profile = await fetchPublicProfileByUsername(String(username));
      if (!profile) {
        setState({ status: 'unavailable' });
        return;
      }
      // Viewing your own profile goes to the editable version.
      if (profile.id === userData.user.id) {
        router.replace('/profile');
        return;
      }
      const [interests, mine] = await Promise.all([fetchInterestsOf(profile.id), fetchMyInterestIds(userData.user.id)]);
      setState({ status: 'ready', profile, interests, shared: commonInterests(mine, interests) });
    } catch {
      setState({ status: 'error' });
    }
  }, [username]);

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
  if (state.status === 'unavailable') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.heading}>This profile is not available</Text>
        <Text style={styles.body}>It may be private, or it may no longer exist.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>We could not load this profile</Text>
        <Button label="Try again" onPress={load} />
      </View>
    );
  }

  const { profile, interests, shared } = state;
  const sharedSet = new Set(shared);
  const inCommon = interests.filter((i) => sharedSet.has(i.id));
  const others = interests.filter((i) => !sharedSet.has(i.id));
  const { has, learning } = splitForProfile(others);

  const open = (p: PickedInterest) => p.slug && router.push(`/interest/${p.slug}`);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `@${profile.username}`, headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />

      <View style={styles.header}>
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.state_name ? <Text style={styles.meta}>{profile.state_name}</Text> : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      {inCommon.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In common ({inCommon.length})</Text>
          <View style={styles.badges}>
            {inCommon.map((p) => (
              <InterestBadge key={p.id} interest={p} onPress={p.slug ? () => open(p) : undefined} />
            ))}
          </View>
        </View>
      ) : null}

      {has.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.badges}>
            {has.map((p) => (
              <InterestBadge key={p.id} interest={p} onPress={p.slug ? () => open(p) : undefined} />
            ))}
          </View>
        </View>
      ) : null}

      {learning.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wants to learn</Text>
          <View style={styles.badges}>
            {learning.map((p) => (
              <InterestBadge key={p.id} interest={p} onPress={p.slug ? () => open(p) : undefined} />
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
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 15, color: colors.inkMuted, textAlign: 'center' },
  header: { gap: 4 },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink },
  username: { fontSize: 16, color: colors.purple, fontWeight: '600' },
  meta: { fontSize: 14, color: colors.inkMuted },
  bio: { fontSize: 15, color: colors.ink, lineHeight: 21, marginTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
