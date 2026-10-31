import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/Button';
import { InterestBadge } from '@/components/InterestBadge';
import { colors, spacing } from '@/constants/theme';
import { splitForProfile, type PickedInterest } from '@/lib/interestRules';
import { fetchMyInterests } from '@/lib/interests';
import { fetchMyProfile, type MyProfile } from '@/lib/profileData';
import { setMyVisibility } from '@/lib/discover';
import { supabase } from '@/lib/supabase';

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'error' }
  | { status: 'ready'; profile: MyProfile | null; picks: PickedInterest[] };

// The signed-in user's own profile: name, username, bio, state and interest badges.
export default function MyProfileScreen() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setState({ status: 'signed-out' });
        return;
      }
      const [profile, picks] = await Promise.all([
        fetchMyProfile(userData.user.id),
        fetchMyInterests(userData.user.id),
      ]);
      setState({ status: 'ready', profile, picks });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  // Reload when the screen comes back into focus, so edits show straight away.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (state.status === 'signed-out') router.replace('/welcome');
  }, [state.status]);

  if (state.status === 'loading' || state.status === 'signed-out') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>We could not load your profile</Text>
        <Button label="Try again" onPress={load} />
      </View>
    );
  }

  const { profile, picks } = state;
  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>Finish setting up your profile</Text>
        <Button label="Set up profile" onPress={() => router.push('/(onboarding)/profile')} />
      </View>
    );
  }

  const { has, learning } = splitForProfile(picks);
  const isPublic = profile.profile_visibility === 'public';

  // Going public is a clear choice: say exactly what others will see first.
  function changeVisibility(next: boolean) {
    const apply = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        await setMyVisibility(userData.user.id, next ? 'public' : 'private');
        load();
      } catch {
        Alert.alert('Could not change your profile', 'Please check your connection and try again.');
      }
    };
    if (!next) {
      apply();
      return;
    }
    Alert.alert(
      'Make your profile public?',
      'Anyone using BeingU will be able to see your name, username, state, bio and interests, and find you in Discover and on interest pages. Your date of birth, phone number and exact location are never shown.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Make public', onPress: apply },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.state_name ? <Text style={styles.meta}>{profile.state_name}</Text> : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.visibility}>
        <View style={styles.visibilityText}>
          <Text style={styles.sectionTitle}>Public profile</Text>
          <Text style={styles.meta}>{isPublic ? 'Visible in Discover and on interest pages.' : 'Only you can see your profile.'}</Text>
        </View>
        <Switch
          accessibilityLabel="Public profile"
          value={isPublic}
          onValueChange={changeVisibility}
          trackColor={{ false: colors.inkMuted, true: colors.purple }}
        />
      </View>

      <Button label="Discover people" variant="secondary" onPress={() => router.push('/discover')} />
      <Button label="Blocked people" variant="secondary" onPress={() => router.push('/blocked')} />
      <Button label="Notices about my account" variant="secondary" onPress={() => router.push('/notices')} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit interests"
            onPress={() => router.push({ pathname: '/(onboarding)/interests', params: { mode: 'edit' } })}
          >
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>
        {has.length === 0 ? (
          <Text style={styles.meta}>No interests yet. Add some so people with the same interests can find you.</Text>
        ) : (
          <View style={styles.badges}>
            {has.map((p) => (
              <InterestBadge key={p.id} interest={p} onPress={p.slug ? () => router.push(`/interest/${p.slug}`) : undefined} />
            ))}
          </View>
        )}
      </View>

      {learning.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Want to learn</Text>
          <View style={styles.badges}>
            {learning.map((p) => (
              <InterestBadge key={p.id} interest={p} onPress={p.slug ? () => router.push(`/interest/${p.slug}`) : undefined} />
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
  header: { gap: 4 },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink },
  username: { fontSize: 16, color: colors.purple, fontWeight: '600' },
  meta: { fontSize: 14, color: colors.inkMuted },
  bio: { fontSize: 15, color: colors.ink, lineHeight: 21, marginTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  edit: { fontSize: 15, color: colors.purple, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  visibility: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  visibilityText: { flex: 1, gap: 2 },
});
